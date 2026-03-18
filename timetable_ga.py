"""
Course Timetable Scheduling using a Genetic Algorithm (GA)
==========================================================

This script schedules n courses into m rooms across k time slots while
satisfying hard constraints (no room-time clashes, no professor conflicts,
no student-group conflicts).  A penalty-based fitness function drives the
GA toward a conflict-free timetable.

Author : AI-generated demo
Date   : 2026-03-17
"""
import random
import copy
from typing import List, Tuple
import matplotlib
matplotlib.use("Agg")  # non-interactive backend so the script works headless
import matplotlib.pyplot as plt

# ──────────────────────────────────────────────────────────────────────────────
# 1.  DEFAULT / SAMPLE DATA
# ──────────────────────────────────────────────────────────────────────────────

DEFAULT_COURSES = [
    ("Math 101",     "Prof. Smith",   "Computer Science", "Div A", 30),
    ("Physics 201",  "Prof. Johnson", "ICT", "Div B", 25),
    ("CS 301",       "Prof. Smith",   "Computer Science", "Div A", 35),
    ("English 101",  "Prof. Davis",   "General Science", "Div C", 40),
    ("History 202",  "Prof. Johnson", "General Science", "Div C", 20),
]

DEFAULT_ROOMS = [
    ("Room 1", 30),
    ("Room 2", 40),
    ("Room 3", 25),
]

DEFAULT_TIME_SLOTS = [
    "Mon 9-10",
    "Mon 11-12",
    "Tue 9-10",
    "Tue 11-12",
]


class TimetableGA:
    def __init__(self, courses=None, rooms=None, timeslots=None, 
                 pop_size=100, mutation_rate=0.05, crossover_rate=0.8, 
                 num_generations=500, tournament_k=3):
        self.courses = courses if courses is not None else DEFAULT_COURSES
        self.rooms = rooms if rooms is not None else DEFAULT_ROOMS
        self.timeslots = timeslots if timeslots is not None else DEFAULT_TIME_SLOTS
        
        self.num_courses = len(self.courses)
        self.num_rooms = len(self.rooms)
        self.num_timeslots = len(self.timeslots)
        
        self.pop_size = int(pop_size)
        self.mutation_rate = float(mutation_rate)
        self.crossover_rate = float(crossover_rate)
        self.num_generations = int(num_generations)
        self.tournament_k = int(tournament_k)

    def create_random_chromosome(self):
        return [
            (random.randint(0, self.num_rooms - 1), random.randint(0, self.num_timeslots - 1))
            for _ in range(self.num_courses)
        ]

    def initialize_population(self):
        return [self.create_random_chromosome() for _ in range(self.pop_size)]

    def evaluate_fitness(self, chromosome: List[Tuple[int, int]]):
        hard_penalties = 0
        soft_score = 0
        
        # Track daily schedules for optimization
        # room_usage[day][room] = count
        room_usage = {}
        # group_schedule[(branch, division)][day] = [(time_slot_index, room_index)]
        group_schedule = {}
        # prof_schedule[prof][day] = [time_slot_index]
        prof_schedule = {}
        # course_schedule[course_name][day] = [time_slot_index]
        course_schedule = {}

        # First pass: check hard constraints and populate daily tracking
        for i in range(self.num_courses):
            room_i, slot_i = chromosome[i]
            c_name  = self.courses[i][0]
            prof_i  = self.courses[i][1]
            branch_i = self.courses[i][2]
            div_i    = self.courses[i][3]
            cap_i   = self.courses[i][4]
            
            group_i = (branch_i, div_i)
            
            # Extract day from timeslot string (e.g. "Mon" from "Mon 9-10")
            ts_str = self.timeslots[slot_i]
            day = ts_str.split(" ")[0] if " " in ts_str else "Unknown"

            # Track Room Usage (Energy Efficiency)
            if day not in room_usage: room_usage[day] = {}
            room_usage[day][room_i] = room_usage[day].get(room_i, 0) + 1

            # Track Group Schedule (Room Affinity & Gaps)
            if group_i not in group_schedule: group_schedule[group_i] = {}
            if day not in group_schedule[group_i]: group_schedule[group_i][day] = []
            group_schedule[group_i][day].append((slot_i, room_i))
            
            # Track Prof Schedule (Gaps)
            if prof_i not in prof_schedule: prof_schedule[prof_i] = {}
            if day not in prof_schedule[prof_i]: prof_schedule[prof_i][day] = []
            prof_schedule[prof_i][day].append(slot_i)
            
            # Track Course Schedule (Consecutive classes)
            if c_name not in course_schedule: course_schedule[c_name] = {}
            if day not in course_schedule[c_name]: course_schedule[c_name][day] = []
            course_schedule[c_name][day].append(slot_i)

            # Hard Constraint: Capacity
            if int(cap_i) > int(self.rooms[room_i][1]):
                hard_penalties += 1

            for j in range(i + 1, self.num_courses):
                room_j, slot_j = chromosome[j]
                if slot_i != slot_j:
                    continue

                # Hard Constraint: Room conflict
                if room_i == room_j:
                    hard_penalties += 1

                # Hard Constraint: Professor conflict
                prof_j = self.courses[j][1]
                if prof_i == prof_j:
                    hard_penalties += 1

                # Hard Constraint: Student group conflict (Branch AND Division must match)
                branch_j = self.courses[j][2]
                div_j    = self.courses[j][3]
                if branch_i == branch_j and div_i == div_j:
                    hard_penalties += 1

        # Second Pass: Calculate Soft Constraints
        
        # 1. Energy Efficiency: Penalize isolated classes in a room on a given day
        for day, rooms_dict in room_usage.items():
            for room, count in rooms_dict.items():
                if count == 1:
                    soft_score -= 2.0 # Penalty for turning on AC/Lights for just 1 class
                elif count > 2:
                    soft_score += (count * 0.5) # Bonus for highly utilizing a room
                    
        # 2. Time Efficiency (Gaps) & Room Affinity for Student Groups
        for group, days in group_schedule.items():
            for day, classes in days.items():
                classes_list: List[Tuple[int, int]] = classes
                if len(classes_list) > 1:
                    # Sort classes by time slot index
                    classes_list.sort(key=lambda x: int(x[0]))
                    # Check for gaps
                    for k in range(len(classes_list) - 1):
                        gap = int(classes_list[k+1][0]) - int(classes_list[k][0])
                        if gap > 1:
                            soft_score -= float(gap) # Penalize idle time
                    # Check room affinity
                    rooms_visited = set([c[1] for c in classes_list])
                    if len(rooms_visited) == 1:
                        soft_score += 3.0 # Big bonus if group stays in exact same room all day

        # 3. Prof Gap Minimization
        for prof, prof_days in prof_schedule.items():
            for day, slots in prof_days.items():
                slots_list: List[int] = slots
                if len(slots_list) > 1:
                    slots_list.sort(key=lambda x: int(x))
                    for k in range(len(slots_list) - 1):
                        gap = int(slots_list[k+1]) - int(slots_list[k])
                        if gap > 1:
                            soft_score -= float(gap)

        # 4. Consecutive course blocks (2-Hour blocks for same course)
        for course, course_days in course_schedule.items():
            for day, c_slots in course_days.items():
                c_slots_list: List[int] = c_slots
                if len(c_slots_list) > 1:
                    c_slots_list.sort(key=lambda x: int(x))
                    for k in range(len(c_slots_list) - 1):
                        if int(c_slots_list[k+1]) - int(c_slots_list[k]) == 1:
                            soft_score += 4.0 # Huge bonus for merging class times consecutively
                        else:
                            soft_score -= 2.0 # Penalty for splitting same course across the day disjointedly

        # Fitness Calculation (0 is perfect hard constraints, then graded by soft score)
        if hard_penalties == 0:
            return 0.0 + (float(soft_score) * 0.01)
        else:
            return -float(hard_penalties) + (float(soft_score) * 0.001)

    def tournament_selection(self, population, fitnesses):
        indices = random.sample(range(len(population)), self.tournament_k)
        best_idx = max(indices, key=lambda idx: fitnesses[idx])
        return copy.deepcopy(population[best_idx])

    def single_point_crossover(self, parent1, parent2):
        if random.random() > self.crossover_rate:
            return copy.deepcopy(parent1), copy.deepcopy(parent2)

        point = random.randint(1, self.num_courses - 1) if self.num_courses > 1 else 1
        child1 = parent1[:point] + parent2[point:]
        child2 = parent2[:point] + parent1[point:]
        return child1, child2

    def mutate(self, chromosome):
        for i in range(len(chromosome)):
            if random.random() < self.mutation_rate:
                new_room = random.randint(0, self.num_rooms - 1)
                new_slot = random.randint(0, self.num_timeslots - 1)
                chromosome[i] = (new_room, new_slot)
        return chromosome

    def get_best(self, population, fitnesses):
        best_idx = max(range(len(population)), key=lambda i: fitnesses[i])
        return copy.deepcopy(population[best_idx]), fitnesses[best_idx]

    def run(self):
        population = self.initialize_population()
        best_overall = None
        best_overall_fit = float("-inf")
        fitness_history = []

        for gen in range(self.num_generations):
            fitnesses = [self.evaluate_fitness(ch) for ch in population]
            gen_best, gen_best_fit = self.get_best(population, fitnesses)
            
            if gen_best_fit > best_overall_fit:
                best_overall = gen_best
                best_overall_fit = gen_best_fit

            fitness_history.append(best_overall_fit)

            if gen % 50 == 0 or gen_best_fit == 0:
                print(f"Generation {gen:>4d} | Best fitness: {gen_best_fit}")

            if gen_best_fit >= 0:
                print(f"\n[OK] Conflict-free schedule found at generation {gen}!")
                print(f"[INFO] Optimized Soft Score: {gen_best_fit:.4f}")
                break

            new_population = [copy.deepcopy(gen_best)]
            while len(new_population) < self.pop_size:
                parent1 = self.tournament_selection(population, fitnesses)
                parent2 = self.tournament_selection(population, fitnesses)
                child1, child2 = self.single_point_crossover(parent1, parent2)
                child1 = self.mutate(child1)
                child2 = self.mutate(child2)
                new_population.append(child1)
                if len(new_population) < self.pop_size:
                    new_population.append(child2)

            population = new_population

        return best_overall, best_overall_fit, fitness_history


def run_ga_api(config_dict=None):
    if config_dict is None:
        config_dict = {}

    ga = TimetableGA(
        courses=config_dict.get("courses"),
        rooms=config_dict.get("rooms"),
        timeslots=config_dict.get("timeslots"),
        pop_size=config_dict.get("population_size", 100),
        mutation_rate=config_dict.get("mutation_rate", 0.05),
        crossover_rate=config_dict.get("crossover_rate", 0.8),
        num_generations=config_dict.get("max_generations", 500),
        tournament_k=config_dict.get("tournament_k", 3)
    )

    best_schedule, best_fitness, fitness_history = ga.run()

    schedule = []
    for i, (room_idx, slot_idx) in enumerate(best_schedule):
        schedule.append({
            "course":    ga.courses[i][0],
            "professor": ga.courses[i][1],
            "branch":    ga.courses[i][2],
            "division":  ga.courses[i][3],
            "capacity":  ga.courses[i][4],
            "room":      ga.rooms[room_idx][0],
            "room_cap":  ga.rooms[room_idx][1],
            "timeslot":  ga.timeslots[slot_idx],
        })

    grid = {
        ga.rooms[r][0]: {
            ga.timeslots[s]: [] for s in range(ga.num_timeslots)
        }
        for r in range(ga.num_rooms)
    }
    for i, (room_idx, slot_idx) in enumerate(best_schedule):
        grid[ga.rooms[room_idx][0]][ga.timeslots[slot_idx]].append(ga.courses[i][0])

    return {
        "schedule":        schedule,
        "grid":            grid,
        "rooms":           [r[0] for r in ga.rooms],
        "timeslots":       ga.timeslots,
        "fitness":         best_fitness,
        "violations":      0 if best_fitness >= 0 else int(abs(best_fitness)),
        "fitness_history": fitness_history,
        "generations_run": len(fitness_history),
        "config": {
            "population_size": ga.pop_size,
            "mutation_rate":   ga.mutation_rate,
            "crossover_rate":  ga.crossover_rate,
            "max_generations": ga.num_generations,
            "num_courses":     ga.num_courses,
            "num_rooms":       ga.num_rooms,
            "num_timeslots":   ga.num_timeslots,
        },
    }


def print_schedule(ga, chromosome):
    print("\n" + "=" * 65)
    print("  BEST SCHEDULE (Course → Room + Timeslot)")
    print("=" * 65)
    for i, (room_idx, slot_idx) in enumerate(chromosome):
        course_name = ga.courses[i][0]
        prof        = ga.courses[i][1]
        group       = ga.courses[i][2]
        room_name   = ga.rooms[room_idx][0]
        slot_name   = ga.timeslots[slot_idx]
        print(f"  {course_name:<14s} | {prof:<16s} | {group:<8s} "
              f"→  {room_name:<8s} @ {slot_name}")
    print("=" * 65)


def print_timetable_grid(ga, chromosome):
    grid = [[[] for _ in range(ga.num_timeslots)] for _ in range(ga.num_rooms)]
    for i, (room_idx, slot_idx) in enumerate(chromosome):
        grid[room_idx][slot_idx].append(ga.courses[i][0])

    col_width = max(len(ts) for ts in ga.timeslots) + 2
    cell_width = max(col_width, 14)
    label_width = max(len(r[0]) for r in ga.rooms) + 2

    print("\n" + "=" * (label_width + cell_width * ga.num_timeslots + ga.num_timeslots + 1))
    print("  TIMETABLE GRID (Rooms × Timeslots)")
    print("=" * (label_width + cell_width * ga.num_timeslots + ga.num_timeslots + 1))

    header = " " * label_width + "|"
    for ts in ga.timeslots:
        header += f" {ts:^{cell_width - 1}}|"
    print(header)
    print("-" * len(header))

    for r in range(ga.num_rooms):
        row = f" {ga.rooms[r][0]:<{label_width - 1}}|"
        for s in range(ga.num_timeslots):
            cell = ", ".join(grid[r][s]) if grid[r][s] else "---"
            row += f" {cell:^{cell_width - 1}}|"
        print(row)

    print("-" * len(header))


def plot_fitness(fitness_history: List[float]):
    plt.figure(figsize=(10, 5))
    violations = [-f for f in fitness_history]
    plt.plot(violations, linewidth=2, color="#e74c3c")
    plt.fill_between(range(len(violations)), violations, alpha=0.15, color="#e74c3c")
    plt.xlabel("Generation", fontsize=12)
    plt.ylabel("Constraint Violations", fontsize=12)
    plt.title("GA Convergence — Constraint Violations vs Generation", fontsize=14)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig("fitness_convergence.png", dpi=150)
    print("\n[PLOT] Convergence plot saved to fitness_convergence.png")


if __name__ == "__main__":
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    ga = TimetableGA()
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║   Course Timetable Scheduling — Genetic Algorithm Demo     ║")
    print("╠══════════════════════════════════════════════════════════════╣")
    print(f"║  Courses     : {ga.num_courses:<5d}                                      ║")
    print(f"║  Rooms       : {ga.num_rooms:<5d}                                      ║")
    print(f"║  Time Slots  : {ga.num_timeslots:<5d}                                      ║")
    print(f"║  Pop. Size   : {ga.pop_size:<5d}                                      ║")
    print(f"║  Generations : {ga.num_generations:<5d}                                      ║")
    print(f"║  Mutation    : {ga.mutation_rate:<5.2f}                                      ║")
    print(f"║  Crossover   : {ga.crossover_rate:<5.2f}                                      ║")
    print("╚══════════════════════════════════════════════════════════════╝\n")

    best_schedule, best_fitness, history = ga.run()

    print_schedule(ga, best_schedule)
    print_timetable_grid(ga, best_schedule)

    if best_fitness >= 0:
        print(f"\nA perfectly conflict-free schedule was found! (Soft Optimization Score: {best_fitness:.4f})")
    else:
        print(f"\n[WARNING] Best fitness achieved: {best_fitness:.4f}  "
              f"({int(abs(best_fitness))} hard violation(s) remaining)")

    plot_fitness(history)
