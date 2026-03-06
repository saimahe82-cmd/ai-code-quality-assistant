/* Sample code snippets for demos and testing */

export const sampleCodes = {
    python: {
        beginner: `# Student Grade Calculator
def calculate_grade(scores):
    total = 0
    for i in range(len(scores)):
        total = total + scores[i]
    average = total / len(scores)
    
    if average >= 90:
        grade = "A"
    elif average >= 80:
        grade = "B"
    elif average >= 70:
        grade = "C"
    elif average >= 60:
        grade = "D"
    else:
        grade = "F"
    
    return grade

# Get student data
student_name = input("Enter student name: ")
Scores = [85, 92, 78, 95, 88]
result = calculate_grade(Scores)

if result == None:
    print "No grade calculated"
else:
    print("Student:", student_name, "Grade:", result)

# Calculate class average
class_scores = []
try:
    while True:
        score = float(input("Enter score (-1 to stop): "))
        if score == -1:
            break
        class_scores.append(score)
except:
    print("Invalid input")

x = sum(class_scores) / len(class_scores)
print("Class average:", x)
`,
        intermediate: `# Task Manager Application
import json
from datetime import datetime

class TaskManager:
    def __init__(self):
        self.tasks = []
        self.completed = []
    
    def add_task(self, title, priority="medium", tags=[]):
        task = {
            "id": len(self.tasks) + 1,
            "title": title,
            "priority": priority,
            "tags": tags,
            "created_at": str(datetime.now()),
            "completed": False
        }
        self.tasks.append(task)
        return task
    
    def complete_task(self, task_id):
        for task in self.tasks:
            if task["id"] == task_id:
                task["completed"] = True
                self.completed.append(task)
                return True
        return None
    
    def get_pending(self):
        pending = []
        for i in range(len(self.tasks)):
            if self.tasks[i]["completed"] == False:
                pending.append(self.tasks[i])
        return pending
    
    def search_tasks(self, keyword):
        results = []
        for task in self.tasks:
            if keyword.lower() in task["title"].lower():
                results.append(task)
        return results
    
    def delete_task(self, task_id):
        for i in range(len(self.tasks)):
            if self.tasks[i]["id"] == task_id:
                del self.tasks[i]
                return True
        return False
    
    def save_to_file(self, filename):
        try:
            with open(filename, 'w') as f:
                json.dump(self.tasks, f)
        except:
            print("Error saving tasks")

# Usage
manager = TaskManager()
manager.add_task("Learn Python", "high")
manager.add_task("Build project", "medium", ["coding", "school"])
manager.complete_task(1)

pending = manager.get_pending()
for t in pending:
    print(t["title"])
`,
        advanced: `# Data Pipeline with Error Handling
from typing import List, Dict, Optional
from dataclasses import dataclass
from functools import reduce
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DataPoint:
    """Represents a single data measurement."""
    timestamp: float
    value: float
    source: str
    
    def is_valid(self) -> bool:
        return self.value is not None and self.timestamp > 0

class DataPipeline:
    """Processes and transforms data through multiple stages."""
    
    def __init__(self, name: str):
        self.name = name
        self.stages: List[callable] = []
        self._processed_count = 0
    
    def add_stage(self, transform_fn: callable) -> 'DataPipeline':
        """Add a processing stage to the pipeline."""
        self.stages.append(transform_fn)
        return self
    
    def process(self, data: List[DataPoint]) -> List[DataPoint]:
        """Run all data through the pipeline stages."""
        result = data
        for stage in self.stages:
            try:
                result = [stage(item) for item in result if item is not None]
            except Exception as e:
                logger.error(f"Pipeline stage failed: {e}")
                raise
        self._processed_count += len(data)
        return result
    
    def get_stats(self) -> Dict[str, int]:
        """Return pipeline statistics."""
        return {
            "stages": len(self.stages),
            "processed": self._processed_count
        }

# Pipeline setup
pipeline = DataPipeline("temperature_readings")
pipeline.add_stage(lambda dp: dp if dp.is_valid() else None)
pipeline.add_stage(lambda dp: DataPoint(dp.timestamp, dp.value * 1.8 + 32, dp.source))

# Sample data
readings = [
    DataPoint(1000, 22.5, "sensor_a"),
    DataPoint(1001, 23.1, "sensor_b"),
    DataPoint(0, -1, "invalid"),
    DataPoint(1003, 21.8, "sensor_a"),
]

results = pipeline.process(readings)
for r in results:
    logger.info(f"Processed: {r.value:.1f}°F from {r.source}")
`
    },
    javascript: {
        beginner: `// Shopping Cart Calculator
var items = [
  { name: "Laptop", price: 999, quantity: 1 },
  { name: "Mouse", price: 29, quantity: 2 },
  { name: "Keyboard", price: 79, quantity: 1 },
  { name: "Monitor", price: 349, quantity: 1 }
];

function calculateTotal(cart) {
  var total = 0;
  for (var i = 0; i < cart.length; i++) {
    total = total + cart[i].price * cart[i].quantity;
  }
  return total;
}

function applyDiscount(total, code) {
  if (code == "SAVE10") {
    return total * 0.9;
  } else if (code == "SAVE20") {
    return total * 0.8;
  }
  return total;
}

var subtotal = calculateTotal(items);
var discount = applyDiscount(subtotal, "SAVE10");

console.log("Subtotal: $" + subtotal);
console.log("After discount: $" + discount);
console.log("Tax: $" + (discount * 0.08));
console.log("Total: $" + (discount * 1.08));

// Find most expensive item
var maxPrice = 0;
var maxItem = "";
for (var j = 0; j < items.length; j++) {
  if (items[j].price > maxPrice) {
    maxPrice = items[j].price;
    maxItem = items[j].name;
  }
}
console.log("Most expensive: " + maxItem);;
`
    }
};

export const sampleProgressData = {
    sessions: [
        { date: '2025-11-01', score: 45, issues: 12 },
        { date: '2025-11-08', score: 52, issues: 10 },
        { date: '2025-11-15', score: 58, issues: 9 },
        { date: '2025-11-22', score: 63, issues: 8 },
        { date: '2025-12-01', score: 67, issues: 7 },
        { date: '2025-12-08', score: 71, issues: 6 },
        { date: '2025-12-15', score: 74, issues: 5 },
        { date: '2025-12-22', score: 79, issues: 4 },
        { date: '2026-01-05', score: 82, issues: 4 },
        { date: '2026-01-12', score: 85, issues: 3 },
        { date: '2026-01-19', score: 83, issues: 4 },
        { date: '2026-01-26', score: 88, issues: 2 },
        { date: '2026-02-02', score: 86, issues: 3 },
        { date: '2026-02-09', score: 90, issues: 2 },
        { date: '2026-02-16', score: 88, issues: 2 },
        { date: '2026-02-23', score: 92, issues: 1 },
    ],
    mistakeCategories: [
        { name: 'Naming Conventions', count: 24, color: '#6c5ce7' },
        { name: 'Error Handling', count: 18, color: '#00cec9' },
        { name: 'Logic Errors', count: 15, color: '#fdcb6e' },
        { name: 'Style Violations', count: 12, color: '#ff6b6b' },
        { name: 'Performance', count: 9, color: '#74b9ff' },
        { name: 'Missing Docs', count: 7, color: '#a855f7' },
        { name: 'Unused Variables', count: 5, color: '#00b894' },
        { name: 'Security', count: 3, color: '#e84393' },
    ],
    recommendations: [
        {
            title: 'Improve Error Handling',
            description: 'You\'ve had 18 error handling issues. Try wrapping risky operations in try/except blocks with specific exception types.',
            link: 'https://docs.python.org/3/tutorial/errors.html',
            priority: 'high'
        },
        {
            title: 'Follow PEP 8 Naming',
            description: 'Variable naming is your most common issue. Remember: snake_case for variables and functions, PascalCase for classes.',
            link: 'https://pep8.org/',
            priority: 'high'
        },
        {
            title: 'Practice Loop Patterns',
            description: 'Consider using enumerate(), zip(), and list comprehensions instead of C-style loops.',
            link: 'https://docs.python.org/3/tutorial/datastructures.html',
            priority: 'medium'
        },
        {
            title: 'Add Type Hints',
            description: 'Type hints make your code self-documenting and help catch bugs early.',
            link: 'https://docs.python.org/3/library/typing.html',
            priority: 'low'
        }
    ]
};

// Sample corpus for plagiarism checking
export const sampleCorpus = [
    {
        name: 'fibonacci_solution_1.py',
        code: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

for i in range(10):
    print(fibonacci(i))`
    },
    {
        name: 'sorting_example.py',
        code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr`
    },
    {
        name: 'calculator_v2.py',
        code: `def calculate(a, b, operation):
    if operation == "add":
        return a + b
    elif operation == "subtract":
        return a - b
    elif operation == "multiply":
        return a * b
    elif operation == "divide":
        if b != 0:
            return a / b
        return None`
    }
];
