def generate_schedule(employees_data, demand_data, school_in_session):
    jobs = ["manager", "server", "driver"]
    num_jobs = 3
    cap_hours = 60
    if not demand_data:
        demand_data = [[0]*num_jobs]
    per_hour_job_cap = [max([row[j] for row in demand_data]) for j in range(num_jobs)]
    all_hours = list(range(7, 23))
    # Convert API employee data to internal format
    employees = {}
    employee_names = {}
    for emp in employees_data:
        emp_id = emp['id']
        # Convert job name to index
        job_name = emp['job'].lower()
        if job_name == "manager":
            job_idx = 0
        elif job_name == "server":
            job_idx = 1
        elif job_name == "driver":
            job_idx = 2
        else:
            continue  
        # Convert time strings to hours (e.g., "09:00" -> 9)
        start_hour = int(emp['start'].split(':')[0])
        end_hour = int(emp['end'].split(':')[0])
        age = emp.get('age', 18)  # Default to 18 if no age provided
        if age == '' or age is None:
            age = 18
        else:
            age = int(age)
        employees[emp_id] = [job_idx, start_hour, end_hour, age]
        employee_names[emp_id] = emp['name']
    
    # Initialize data structures
    hours_used = 0
    shifts = {}
    hours_per_person = {}
    remaining_demand = [row[:] for row in demand_data]
    anchors = []
    split_used = {}
    
    # STEP 2: Anchor placement based on best hour
    for id, info in employees.items():
        job = info[0]
        best_hour, best_score = findbesthr(id, info, remaining_demand)
        
        if best_hour is None or not legal_hour(best_hour, info[3], school_in_session):
            continue
        
        anchors.append((best_score, id, best_hour))
    
    anchors.sort(reverse=True)
    
    # Greedily assign the original hours
    max_anchors = min(10, len(employees))
    anchors_used = 0
    for score, id, h in anchors:
        if hours_used >= cap_hours:
            break
        if anchors_used >= max_anchors:
            break
        if score <= 0:
            continue
        info = employees[id]
        if not legal_hour(h, info[3], school_in_session):
            continue
        shifts[id] = [(h, h)]
        hours_per_person[id] = 1
        split_used[id] = False
        job = info[0]
        remaining_demand[h][job] = remaining_demand[h][job] - 1
        hours_used += 1
        anchors_used += 1
    
    # STEP 3: Expand anchored shifts greedily (with spreading logic)
    while hours_used < cap_hours:
        best_score = float('-inf')
        best_choice = None
        
        for id, intervals in shifts.items():
            info = employees[id]
            job = info[0]
            daily_cap = get_daily_cap(info[3])
            
            if hours_per_person.get(id, 0) >= daily_cap:
                continue
            # Calculate workload penalty - penalize employees with more hours
            current_hours = hours_per_person.get(id, 0)
            workload_penalty = current_hours * 0.1  # Adjust multiplier to control spreading
            for idx, (start, end) in enumerate(intervals):
                # Extend left
                if start > info[1]:
                    candidate = start - 1
                    if legal_hour(candidate, info[3], school_in_session):
                        new_intervals = intervals.copy()
                        new_intervals[idx] = (candidate, end)
                        if respects_continuous_limit(new_intervals, info[3]):
                            gain = remaining_demand[candidate][job] if 0 <= candidate < len(remaining_demand) else 0
                            # Apply spreading: gain minus workload penalty
                            score = gain - workload_penalty
                            if score > best_score:
                                best_score = score
                                best_choice = (id, idx, "left", candidate)
                # Extend right
                if end < info[2]:
                    candidate = end + 1
                    if legal_hour(candidate, info[3], school_in_session):
                        new_intervals = intervals.copy()
                        new_intervals[idx] = (start, candidate)
                        if respects_continuous_limit(new_intervals, info[3]):
                            gain = remaining_demand[candidate][job] if 0 <= candidate < len(remaining_demand) else 0
                            # Apply spreading: gain minus workload penalty
                            score = gain - workload_penalty
                            if score > best_score:
                                best_score = score
                                best_choice = (id, idx, "right", candidate)
        # Try split shift if no contiguous expansion
        if best_choice is None and hours_used < cap_hours:
            for id, info in employees.items():
                if split_used.get(id, False):
                    continue
                if hours_per_person.get(id, 0) >= get_daily_cap(info[3]):
                    continue
                job = info[0]
                existing_hours = []
                if id in shifts:
                    for (s, e) in shifts[id]:
                        existing_hours.extend(range(s, e + 1))
                candidate_hours = [h for h in range(info[1], info[2] + 1)
                                   if legal_hour(h, info[3], school_in_session)
                                   and all(abs(h - eh) > 1 for eh in existing_hours)]
                candidate_hours.sort(key=lambda h: remaining_demand[h][job] if 0 <= h < len(remaining_demand) else 0, reverse=True)
                if candidate_hours:
                    h = candidate_hours[0]
                    best_choice = (id, None, "split", h)
                    gain = remaining_demand[h][job] if 0 <= h < len(remaining_demand) else 0
                    best_score = gain
                    break
        
        if best_choice is None or best_score <= 0:
            break
        
        (id, idx, direction, new_hour) = best_choice
        info = employees[id]
        daily_cap = get_daily_cap(info[3])
        
        if hours_per_person.get(id, 0) >= daily_cap:
            continue
        
        if direction == "split":
            if id not in shifts:
                shifts[id] = []
            shifts[id].append((new_hour, new_hour))
            split_used[id] = True
        else:
            start, end = shifts[id][idx]
            if direction == "left":
                shifts[id][idx] = (new_hour, end)
            else:
                shifts[id][idx] = (start, new_hour)
        
        job = employees[id][0]
        remaining_demand[new_hour][job] = remaining_demand[new_hour][job] - 1
        hours_used += 1
        hours_per_person[id] = hours_per_person.get(id, 0) + 1
    
    # STEP 4: Fill remaining gaps
    for id, info in employees.items():
        if id in shifts:
            continue
        if hours_used >= cap_hours:
            break
        daily_cap = get_daily_cap(info[3])
        candidate_hours = [h for h in range(info[1], info[2] + 1) if legal_hour(h, info[3], school_in_session)]
        candidate_hours.sort(key=lambda h: remaining_demand[h][info[0]] if 0 <= h < len(remaining_demand) else 0, reverse=True)
        for h in candidate_hours:
            if hours_used >= cap_hours:
                break
            if h < 0 or h >= len(remaining_demand):
                continue
            if remaining_demand[h][info[0]] <= 0:
                continue
            if hours_per_person.get(id, 0) >= daily_cap:
                break
            
            shifts[id] = [(h, h)]
            hours_per_person[id] = 1
            split_used[id] = False
            remaining_demand[h][info[0]] -= 1
            hours_used += 1
            break
    

    # STEP 5: Replace or remove single-hour employees
    # Identify employees scheduled for only 1 hour
    single_hour_employees = [id for id, hours in hours_per_person.items() if hours == 1]
    
    for single_id in single_hour_employees:
        # Get the hour this employee is scheduled
        single_intervals = shifts.get(single_id, [])
        if not single_intervals:
            continue
        
        single_hour = single_intervals[0][0]  # Should be (h, h) for single hour
        single_job = employees[single_id][0]
        
        replacement_found = False
        best_replacement = None
        
        # Try to extend an existing employee's shift to cover this hour
        for other_id, other_intervals in shifts.items():
            if other_id == single_id:
                continue
            
            other_info = employees[other_id]
            other_job = other_info[0]
            
            # Must be same job type
            if other_job != single_job:
                continue
            
            # Check if this employee can work this hour
            if not (other_info[1] <= single_hour <= other_info[2]):
                continue
            
            if not legal_hour(single_hour, other_info[3], school_in_session):
                continue
            
            # Check if expanding would violate constraints
            daily_cap = get_daily_cap(other_info[3])
            current_hours = hours_per_person.get(other_id, 0)
            
            if current_hours >= daily_cap:
                continue
            
            # Try to extend adjacent to existing intervals
            for idx, (start, end) in enumerate(other_intervals):
                # Can we extend left to cover single_hour?
                if single_hour == start - 1:
                    new_intervals = other_intervals.copy()
                    new_intervals[idx] = (single_hour, end)
                    if respects_continuous_limit(new_intervals, other_info[3]):
                        best_replacement = ('extend', other_id, idx, (single_hour, end))
                        replacement_found = True
                        break
                
                # Can we extend right to cover single_hour?
                if single_hour == end + 1:
                    new_intervals = other_intervals.copy()
                    new_intervals[idx] = (start, single_hour)
                    if respects_continuous_limit(new_intervals, other_info[3]):
                        best_replacement = ('extend', other_id, idx, (start, single_hour))
                        replacement_found = True
                        break
            
            if replacement_found:
                break
        
        # If no adjacent extension found, try split shift
        if not replacement_found:
            for other_id, other_intervals in shifts.items():
                if other_id == single_id:
                    continue
                
                other_info = employees[other_id]
                other_job = other_info[0]
                
                # Must be same job type
                if other_job != single_job:
                    continue
                
                # Check if this employee can work this hour
                if not (other_info[1] <= single_hour <= other_info[2]):
                    continue
                
                if not legal_hour(single_hour, other_info[3], school_in_session):
                    continue
                
                # Check if expanding would violate constraints
                daily_cap = get_daily_cap(other_info[3])
                current_hours = hours_per_person.get(other_id, 0)
                
                if current_hours >= daily_cap:
                    continue
                
                # Check if this hour is far enough from existing shifts
                existing_hours = []
                for (s, e) in other_intervals:
                    existing_hours.extend(range(s, e + 1))
                
                if all(abs(single_hour - eh) > 1 for eh in existing_hours):
                    # Can add as split shift
                    new_intervals = other_intervals + [(single_hour, single_hour)]
                    if respects_continuous_limit(new_intervals, other_info[3]):
                        best_replacement = ('split', other_id, None, single_hour)
                        replacement_found = True
                        break
        
        # Apply replacement if found, otherwise just delete
        if replacement_found and best_replacement:
            action, other_id, idx, new_data = best_replacement
            
            if action == 'extend':
                shifts[other_id][idx] = new_data
                hours_per_person[other_id] = hours_per_person.get(other_id, 0) + 1
            elif action == 'split':
                shifts[other_id].append((new_data, new_data))
                hours_per_person[other_id] = hours_per_person.get(other_id, 0) + 1
        
        # Remove the single-hour employee (whether replaced or not)
        if single_id in shifts:
            del shifts[single_id]
        if single_id in hours_per_person:
            hours_removed = hours_per_person[single_id]
            del hours_per_person[single_id]
            hours_used -= hours_removed

    # STEP 6: Build schedule grid
    schedule_grid = {hour: {job: [] for job in jobs} for hour in all_hours}
    for id, intervals in shifts.items():
        job_index = employees[id][0]
        job_name = jobs[job_index]
        for (start, end) in intervals:
            for h in range(start, end + 1):
                # Enforce per-hour cap for each job
                if len(schedule_grid[h][job_name]) < per_hour_job_cap[job_index]:
                    schedule_grid[h][job_name].append(id)

    # Ensure at least one person per job per hour
    for h in all_hours:
        for job_index, job_name in enumerate(jobs):
            if len(schedule_grid[h][job_name]) == 0:
                # Find available employee for this job and hour
                for id, info in employees.items():
                    if info[0] == job_index and info[1] <= h <= info[2]:
                        if legal_hour(h, info[3], school_in_session):
                            schedule_grid[h][job_name].append(id)
                            break

    return {
        "schedule": schedule_grid,
        "shifts": shifts,
        "hours_per_person": hours_per_person,
        "total_hours": hours_used,
        "remaining_demand": remaining_demand,
        "employee_names": employee_names
    }


def findbesthr(id, info, remaining_demand):
    best_hour = None
    best_score = float('-inf')
    #score -> "how many people are still needed". We want to pick the highest score because that represents the hour where the employee is needed most.
    #iterate every hour in the employee's availability
    for h in range(info[1], info[2] + 1):  # info[1]=start, info[2]=end
        #read demand for job at hour h
        job = info[0]  # info[0]=job
        score = remaining_demand[h][job]
        if score > best_score:
            best_score = score
            best_hour = h
        elif score == best_score:
            best_hour = max(best_hour, h)
            #at the moment, ties are broken by taking the later time
    return (best_hour, best_score)
def get_daily_cap(age):
    if age <= 15:
        return 3
    elif 16 <= age <= 17:  
        return 8
    else:
        return 24
def legal_hour(h, age, school_in_session):
    if age <= 15:
        # 14-15 years:
        # cannot work before 7am or after 9pm
        if h < 7 or h >= 21:
            return False
    elif 16 <= age <= 17:
        # cannot work before 7am on school day
        if school_in_session and h < 7:
            return False
        # cannot work after 11pm
        if h >= 23:
            return False
    return True
def respects_continuous_limit(intervals, age):
    if age > 17:
        return True
    for (s, e) in intervals:
        if (e - s + 1) >= 5:
            return False
    return True
