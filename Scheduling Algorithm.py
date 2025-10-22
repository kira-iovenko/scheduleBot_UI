def generate_schedule(employees_data, demand_data, school_in_session):
    """
    Main function to generate a schedule from API data.
    
    Args:
        employees_data: List of employee dicts from API
            [{"id": 1, "name": "Alice", "age": 25, "job": "insider", "start": "09:00", "end": "17:00"}, ...]
        demand_data: 2D array [hour][job] representing demand
            [[manager_demand, insider_demand, driver_demand], ...] for each hour 0-23
        school_in_session: Boolean indicating if school is in session
    
    Returns:
        dict: {
            "schedule": {hour: {job: [employee_ids]}},
            "shifts": {employee_id: [(start, end), ...]},
            "hours_per_person": {employee_id: total_hours},
            "total_hours": int,
            "remaining_demand": [[...]]
        }
    """
    jobs = ["manager", "insider", "driver"]
    num_jobs = 3
    cap_hours = 60
    # New: Per-hour cap for each job
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
        elif job_name == "insider":
            job_idx = 1
        elif job_name == "driver":
            job_idx = 2
        else:
            continue  # Skip unknown jobs
        
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
    
    # STEP 3: Expand anchored shifts greedily
    while hours_used < cap_hours:
        best_gain = 0
        best_choice = None
        
        for id, intervals in shifts.items():
            info = employees[id]
            job = info[0]
            daily_cap = get_daily_cap(info[3])
            
            if hours_per_person.get(id, 0) >= daily_cap:
                continue
            
            for idx, (start, end) in enumerate(intervals):
                # Extend left
                if start > info[1]:
                    candidate = start - 1
                    if legal_hour(candidate, info[3], school_in_session):
                        new_intervals = intervals.copy()
                        new_intervals[idx] = (candidate, end)
                        if respects_continuous_limit(new_intervals, info[3]):
                            gain = remaining_demand[candidate][job] if 0 <= candidate < len(remaining_demand) else 0
                            if gain >= best_gain:
                                best_gain = gain
                                best_choice = (id, idx, "left", candidate)
                # Extend right
                if end < info[2]:
                    candidate = end + 1
                    if legal_hour(candidate, info[3], school_in_session):
                        new_intervals = intervals.copy()
                        new_intervals[idx] = (start, candidate)
                        if respects_continuous_limit(new_intervals, info[3]):
                            gain = remaining_demand[candidate][job] if 0 <= candidate < len(remaining_demand) else 0
                            if gain >= best_gain:
                                best_gain = gain
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
                    best_gain = remaining_demand[h][job] if 0 <= h < len(remaining_demand) else 0
                    break
        
        if best_choice is None or best_gain <= 0:
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
    

    # STEP 5: Build schedule grid
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
