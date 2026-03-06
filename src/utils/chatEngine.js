/* ═══════════════════════════════════════════════════════════════════════
   AI Chatbot Response Engine — Interactive & Friendly
   Context-aware, personality-driven responses with code understanding
   ═══════════════════════════════════════════════════════════════════════ */

// ─── Bot Personality Traits ───
const GREETINGS = [
    "Hey there! 👋 What can I help you with?",
    "Hi friend! 😊 Ready to level up your code!",
    "Hello! 🚀 Let's make your code awesome!",
    "Hey! 💜 I'm here to help. What's up?",
    "Hi! ✨ Got a coding question? Let's dive in!"
];

const ENCOURAGEMENTS = [
    "You're doing great! 💪",
    "Keep it up, you're making progress! 🌟",
    "Nice thinking! That's a smart question! 🧠",
    "Love your curiosity! Let's figure this out together! 🤝",
    "Great question — this is how pros learn! 📚"
];

const FAREWELLS = [
    "Happy coding! 🚀 Come back anytime!",
    "Keep building amazing things! 🎉 See you soon!",
    "You got this! 💪 Happy to help anytime!",
    "Good luck with your code! 🍀 I'm here when you need me!",
    "Go crush it! 🔥 Come back whenever you're stuck!"
];

const EMOJIS_BY_TOPIC = {
    error: '🔴',
    fix: '🔧',
    performance: '⚡',
    style: '🎨',
    concept: '💡',
    debug: '🐛',
    success: '✅',
    warning: '⚠️',
    tip: '💡',
    python: '🐍',
    javascript: '⚡',
    java: '☕'
};

function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomEncouragement() {
    return Math.random() > 0.6 ? '\n\n' + randomPick(ENCOURAGEMENTS) : '';
}

// ─── Smart Knowledge Base ───
const knowledgeBase = {
    patterns: [
        // ═══ Greetings & Small Talk ═══
        {
            triggers: ['hello', 'hi', 'hey', 'sup', 'howdy', 'good morning', 'good evening', 'good afternoon'],
            response: () => randomPick(GREETINGS),
            category: 'greeting'
        },
        {
            triggers: ['bye', 'goodbye', 'see you', 'later', 'thanks bye', 'gotta go', 'i\'m done'],
            response: () => randomPick(FAREWELLS),
            category: 'farewell'
        },
        {
            triggers: ['thanks', 'thank you', 'ty', 'thx', 'appreciate'],
            response: () => randomPick([
                "You're welcome! 😊 Always happy to help!",
                "Anytime! 💜 That's what I'm here for!",
                "No problem at all! 🤗 Got more questions? Fire away!",
                "Glad I could help! ✨ Keep up the great work!",
                "My pleasure! 🌟 Don't hesitate to ask more!"
            ]),
            category: 'thanks'
        },
        {
            triggers: ['how are you', 'how do you do', 'what\'s up', 'how\'s it going'],
            response: () => randomPick([
                "I'm doing great, thanks for asking! 😊 Ready to help with some code!",
                "Fantastic! 🚀 Just waiting to help you write better code!",
                "I'm all charged up and ready to debug! ⚡ What are we working on?",
                "Living my best bot life! 🤖✨ What code challenges shall we tackle?"
            ]),
            category: 'smalltalk'
        },
        {
            triggers: ['who are you', 'what are you', 'your name', 'what can you do'],
            response: () => `I'm **CodeMentor Bot** 🤖✨ — your friendly AI coding assistant!\n\nHere's what I can do:\n🔍 **Explain error messages** — paste any error and I'll break it down\n🐛 **Debug your code** — help find and fix bugs\n💡 **Teach concepts** — loops, functions, OOP, and more\n⚡ **Performance tips** — make your code faster\n🎨 **Style advice** — write cleaner, more readable code\n📚 **Best practices** — learn industry standards\n\nI work best when you share your actual code! Try pasting it in the editor and asking me about it.`,
            category: 'identity'
        },
        {
            triggers: ['joke', 'funny', 'make me laugh', 'tell me something funny'],
            response: () => randomPick([
                "Why do programmers prefer dark mode? 🌙\n\nBecause light attracts bugs! 🐛😄",
                "A SQL query walks into a bar, walks up to two tables and asks... 🍺\n\n\"Can I JOIN you?\" 😂",
                "Why was the JavaScript developer sad? 😢\n\nBecause he didn't Node how to Express himself! 😄",
                "What's a programmer's favorite hangout place? 🏠\n\nFoo Bar! 🍻😄",
                "How do trees use computers? 🌳\n\nThey log in! 📝😄",
                "Why do Python programmers have low self-esteem?\n\nBecause they're always comparing themselves to None! 🐍😄",
                "What's the object-oriented way to become wealthy? 💰\n\nInheritance! 😄"
            ]),
            category: 'fun'
        },

        // ═══ Error-Related ═══
        {
            triggers: ['null pointer', 'null reference', 'nonetype', 'attributeerror', 'undefined is not', 'cannot read properties of null'],
            response: () => `${EMOJIS_BY_TOPIC.error} **NullPointerException / TypeError** — One of the most common bugs!\n\nThis happens when you try to use a variable that's \`null\`, \`undefined\`, or \`None\`.\n\n**Why does it happen?**\n1. Forgetting to initialize a variable before using it\n2. A function silently returning \`None\`/\`undefined\`\n3. Accessing a property that doesn't exist on an object\n4. Misspelling a variable name\n\n**${EMOJIS_BY_TOPIC.fix} Quick fixes:**\n\`\`\`python\n# Python — Use defensive checks\nif result is not None:\n    result.process()\n\n# Or use try/except\ntry:\n    value = data["key"]\nexcept (KeyError, TypeError):\n    value = default_value\n\`\`\`\n\n\`\`\`javascript\n// JavaScript — Use optional chaining\nconst name = user?.profile?.name ?? "Unknown";\n\`\`\`\n\n💡 **Pro tip:** Enable strict null checks in TypeScript to catch these at compile time!${randomEncouragement()}`,
            category: 'error'
        },
        {
            triggers: ['infinite loop', 'loop forever', 'loop never stops', 'loop not ending', 'program hangs', 'program stuck'],
            response: () => `${EMOJIS_BY_TOPIC.warning} **Infinite Loop Detected!**\n\nYour program gets stuck because the loop's exit condition is never met.\n\n**🔍 Most common causes:**\n1. Loop variable isn't updated inside the loop\n2. The condition always evaluates to \`True\`\n3. Off-by-one errors (\`<=\` instead of \`<\`)\n4. Accidentally resetting the counter inside the loop\n\n**${EMOJIS_BY_TOPIC.debug} Debugging steps:**\n\`\`\`python\n# Add a print + safety counter\nmax_iterations = 1000\ncount = 0\nwhile condition:\n    print(f"Iteration {count}: variable = {variable}")\n    count += 1\n    if count > max_iterations:\n        print("⚠️ Safety break!")\n        break\n    # ... your logic ...\n\`\`\`\n\n💡 **Pro tip:** Use a debugger to step through your loop iteration by iteration!${randomEncouragement()}`,
            category: 'error'
        },
        {
            triggers: ['return none', 'returning none', 'function returns none', 'undefined return', 'function not returning'],
            response: () => `${EMOJIS_BY_TOPIC.tip} **Function returning None/undefined?** This is super common!\n\n**Why it happens:**\n1. Missing \`return\` statement (Python implicitly returns None)\n2. Return is inside an \`if\` block that never executes\n3. Accidentally using \`print()\` instead of \`return\`\n4. Return is inside a nested function\n\n**✅ Good pattern:**\n\`\`\`python\ndef calculate_total(items):\n    if not items:         # Handle edge case\n        return 0\n    \n    total = sum(items)\n    return total           # Always have a return!\n\`\`\`\n\n**❌ Common mistake:**\n\`\`\`python\ndef add(a, b):\n    result = a + b\n    print(result)  # This PRINTS but doesn't RETURN!\n    # No return statement → returns None\n\`\`\`\n\n💡 Remember: \`print()\` ≠ \`return\`! Print shows output, return sends a value back.${randomEncouragement()}`,
            category: 'error'
        },
        {
            triggers: ['syntax error', 'syntaxerror', 'parse error', 'unexpected token', 'unexpected eof'],
            response: () => `${EMOJIS_BY_TOPIC.error} **SyntaxError** — Your code has a grammar mistake!\n\nThe interpreter can't understand your code structure.\n\n**🔍 Top causes (ranked by frequency):**\n1. Missing closing \`)\`, \`}\`, or \`]\`\n2. Forgetting \`:\` after \`if\`/\`for\`/\`def\`/\`class\` in Python\n3. Misspelled keywords (\`retrun\` instead of \`return\`)\n4. Missing or extra quotes around strings\n5. Using \`=\` instead of \`==\` in conditions\n\n**🕵️ Detective tip:** The error line number is where Python *noticed* the problem, but the actual bug might be on the **line above**! Check both lines.\n\n**${EMOJIS_BY_TOPIC.fix} Try these:**\n- Count your opening and closing brackets\n- Check for consistent quote usage\n- Look for missing commas in lists/dicts\n- Ensure proper indentation${randomEncouragement()}`,
            category: 'error'
        },
        {
            triggers: ['list index', 'index out of range', 'indexerror', 'array out of bounds', 'arrayindexoutofbound'],
            response: () => `${EMOJIS_BY_TOPIC.error} **IndexError: list index out of range**\n\nYou're trying to access an element that doesn't exist!\n\n**Remember:** Lists are **0-indexed**:\n\`\`\`\nmy_list = ["a", "b", "c"]\n             0     1     2    ← valid indices\n            -3    -2    -1    ← negative indices\nmy_list[3]  → ❌ IndexError!\nmy_list[2]  → ✅ "c"\n\`\`\`\n\n**${EMOJIS_BY_TOPIC.fix} Safe access patterns:**\n\`\`\`python\n# Check first\nif i < len(my_list):\n    value = my_list[i]\n\n# Or use try/except\ntry:\n    value = my_list[i]\nexcept IndexError:\n    value = default_value\n\n# Or use slicing (never throws!)\nvalue = my_list[i:i+1]  # Returns [] if out of range\n\`\`\`\n\n💡 **Common gotcha:** \`len(list)\` returns the count (e.g., 5), but the last valid index is \`len(list) - 1\` (e.g., 4)!${randomEncouragement()}`,
            category: 'error'
        },
        {
            triggers: ['indentation', 'indent error', 'indentationerror', 'unexpected indent', 'tab error'],
            response: () => `${EMOJIS_BY_TOPIC.error} **IndentationError** — Python is very picky about whitespace!\n\n**The #1 cause:** Mixing tabs and spaces! 🚫\n\n**${EMOJIS_BY_TOPIC.fix} Fix it in 3 steps:**\n1. Open your editor settings\n2. Set "Insert Spaces" = true, "Tab Size" = 4\n3. Select all code → "Convert Indentation to Spaces"\n\n**Visual guide:**\n\`\`\`python\ndef greet(name):        # ← colon starts an indented block\n    if name:             # ← 4 spaces (one level)\n        message = "Hi"   # ← 8 spaces (two levels)\n        print(message)   # ← same level as message\n    return message       # ← back to one level\n\`\`\`\n\n💡 **Pro tip:** Make whitespace visible in your editor! VS Code: View → Render Whitespace${randomEncouragement()}`,
            category: 'error'
        },
        {
            triggers: ['recursion', 'stack overflow', 'maximum recursion', 'recursive', 'recursionerror'],
            response: () => `${EMOJIS_BY_TOPIC.warning} **RecursionError** — Your recursive function called itself too many times!\n\n**Every recursive function needs TWO things:**\n1. 🛑 **Base case** — when to STOP\n2. 🔄 **Recursive step** — must move TOWARD the base case\n\n**✅ Good recursion:**\n\`\`\`python\ndef factorial(n):\n    if n <= 1:              # 🛑 Base case\n        return 1\n    return n * factorial(n - 1)  # 🔄 n gets smaller!\n\nprint(factorial(5))  # → 120\n\`\`\`\n\n**❌ Infinite recursion:**\n\`\`\`python\ndef oops(n):\n    return n * oops(n)  # n never changes! 💀\n\`\`\`\n\n**${EMOJIS_BY_TOPIC.tip} Mental model:** Think of recursion like Russian nesting dolls 🪆 — each call opens a smaller doll until you reach the smallest one.\n\n💡 If recursion is too deep, consider converting to an iterative loop with a stack!${randomEncouragement()}`,
            category: 'concept'
        },
        {
            triggers: ['key error', 'keyerror', 'dictionary key', 'dict key not found'],
            response: () => `${EMOJIS_BY_TOPIC.error} **KeyError** — You tried to access a dictionary key that doesn't exist!\n\n**${EMOJIS_BY_TOPIC.fix} Safe access patterns:**\n\`\`\`python\nuser = {"name": "Alice", "age": 25}\n\n# Method 1: .get() with default value (recommended!)\nemail = user.get("email", "not provided")\n\n# Method 2: Check first\nif "email" in user:\n    email = user["email"]\n\n# Method 3: try/except\ntry:\n    email = user["email"]\nexcept KeyError:\n    email = None\n\`\`\`\n\n💡 **Bonus:** Use \`defaultdict\` from \`collections\` for dicts that auto-create missing keys!${randomEncouragement()}`,
            category: 'error'
        },
        {
            triggers: ['type error', 'typeerror', 'unsupported operand', 'can\'t multiply', 'can\'t add'],
            response: () => `${EMOJIS_BY_TOPIC.error} **TypeError** — You tried to do something with the wrong type!\n\n**Common examples:**\n\`\`\`python\n# ❌ Adding string + number\n"Age: " + 25      # TypeError!\n"Age: " + str(25)  # ✅ "Age: 25"\n\n# ❌ Calling a non-function\nx = 42\nx()  # TypeError: 'int' is not callable\n\n# ❌ Wrong number of arguments\ndef add(a, b): return a + b\nadd(1, 2, 3)  # TypeError: too many arguments\n\`\`\`\n\n**${EMOJIS_BY_TOPIC.fix} Debugging tip:** Use \`type(variable)\` or \`isinstance()\` to check types when confused!${randomEncouragement()}`,
            category: 'error'
        },

        // ═══ Concepts & Learning ═══
        {
            triggers: ['make loop faster', 'optimize loop', 'loop performance', 'slow loop', 'make code faster', 'optimization'],
            response: () => `${EMOJIS_BY_TOPIC.performance} **Optimization Tips — Write Faster Code!**\n\n**🥇 High-impact optimizations:**\n1. **Move invariant computations outside loops**\n\`\`\`python\n# ❌ Slow\nfor item in items:\n    result = expensive_function()  # Called every iteration!\n\n# ✅ Fast\ncached = expensive_function()  # Called once!\nfor item in items:\n    result = cached\n\`\`\`\n\n2. **Use the right data structure**\n\`\`\`python\n# ❌ O(n) lookup\nif item in my_list:  # Slow for large lists!\n\n# ✅ O(1) lookup\nif item in my_set:   # Blazing fast!\n\`\`\`\n\n3. **List comprehensions > for loops** (2-4x faster in Python)\n\`\`\`python\n# ❌ Slow\nresult = []\nfor x in data:\n    result.append(x * 2)\n\n# ✅ Fast\nresult = [x * 2 for x in data]\n\`\`\`\n\n4. **Break early** when you've found what you need\n5. **Use built-ins** — \`sum()\`, \`min()\`, \`max()\`, \`sorted()\` are implemented in C!\n\n💡 **Golden rule:** Profile first, optimize second! Don't guess where the bottleneck is.${randomEncouragement()}`,
            category: 'performance'
        },
        {
            triggers: ['pep 8', 'style guide', 'coding style', 'best practice', 'convention', 'clean code', 'readable'],
            response: () => `${EMOJIS_BY_TOPIC.style} **Writing Clean, Beautiful Code!**\n\n**📝 Naming conventions:**\n\`\`\`python\n# Python\nmy_variable = "snake_case"       # variables\ndef my_function():                # functions\nclass MyClass:                    # classes\nMAX_RETRIES = 3                   # constants\n\n# JavaScript\nlet myVariable = "camelCase";     // variables\nfunction myFunction() {}          // functions\nclass MyClass {}                  // classes\nconst MAX_RETRIES = 3;            // constants\n\`\`\`\n\n**💎 Clean code principles:**\n1. Functions should do ONE thing and do it well\n2. Use descriptive names (\`calculate_total\` not \`calc\`)\n3. Keep functions under 20 lines when possible\n4. Comments explain WHY, not WHAT\n5. DRY — Don't Repeat Yourself\n\n**🔧 Tools to help:**\n- Python: \`pylint\`, \`black\` (auto-formatter), \`flake8\`\n- JavaScript: \`eslint\`, \`prettier\`\n\n💡 Clean code is not about impressing others — it's a gift to your future self! 🎁${randomEncouragement()}`,
            category: 'style'
        },
        {
            triggers: ['variable', 'what is a variable', 'variables explained', 'how do variables work'],
            response: () => `${EMOJIS_BY_TOPIC.concept} **Variables — The Building Blocks of Code!**\n\nThink of a variable as a **labeled box** 📦 that stores a value.\n\n\`\`\`python\n# Python\nname = "Alice"      # 📦 Box labeled "name" contains "Alice"\nage = 25            # 📦 Box labeled "age" contains 25\nis_student = True   # 📦 Box labeled "is_student" contains True\n\n# You can change what's in the box!\nage = 26            # 📦 Now "age" contains 26\n\`\`\`\n\n**Types of values a variable can hold:**\n| Type     | Example          | Used for          |\n|----------|------------------|-------------------|\n| String   | \`"Hello"\`       | Text              |\n| Integer  | \`42\`            | Whole numbers     |\n| Float    | \`3.14\`          | Decimal numbers   |\n| Boolean  | \`True/False\`    | Yes/No decisions  |\n| List     | \`[1, 2, 3]\`     | Collections       |\n\n💡 **Naming tip:** Choose names that explain what the variable stores!\n\`age\` ✅  vs  \`x\` ❌${randomEncouragement()}`,
            category: 'concept'
        },
        {
            triggers: ['loop', 'for loop', 'while loop', 'how do loops work', 'iteration'],
            response: () => `${EMOJIS_BY_TOPIC.concept} **Loops — Repeat Actions Automatically!**\n\nLoops let you run code multiple times without copy-pasting.\n\n**🔄 For Loop** — when you know how many times:\n\`\`\`python\n# Print 1 to 5\nfor i in range(1, 6):\n    print(f"Count: {i}")\n# Output: Count: 1, Count: 2, ... Count: 5\n\n# Loop through a list\nfruits = ["apple", "banana", "cherry"]\nfor fruit in fruits:\n    print(f"I love {fruit}!")\n\`\`\`\n\n**🔁 While Loop** — when you don't know how many times:\n\`\`\`python\npassword = ""\nwhile password != "secret123":\n    password = input("Enter password: ")\nprint("Access granted! ✅")\n\`\`\`\n\n**⚡ Useful loop tricks:**\n- \`break\` — exit the loop immediately\n- \`continue\` — skip to next iteration\n- \`enumerate()\` — get index AND value\n\n\`\`\`python\nfor i, item in enumerate(my_list):\n    print(f"#{i}: {item}")\n\`\`\`${randomEncouragement()}`,
            category: 'concept'
        },
        {
            triggers: ['function', 'def ', 'how to write a function', 'what is a function', 'methods'],
            response: () => `${EMOJIS_BY_TOPIC.concept} **Functions — Reusable Blocks of Code!**\n\nA function is like a mini-program inside your program. 🎁\n\n**Basic structure:**\n\`\`\`python\ndef greet(name, greeting="Hello"):  # Parameters with default\n    """Say hello to someone."""       # Docstring (always add!)\n    message = f"{greeting}, {name}!"\n    return message                    # Send value back\n\n# Call it!\nresult = greet("Alice")        # "Hello, Alice!"\nresult = greet("Bob", "Hey")   # "Hey, Bob!"\n\`\`\`\n\n**🎯 Good function principles:**\n1. Does ONE thing well\n2. Has a descriptive name (\`calculate_tax\` not \`do_stuff\`)\n3. Returns a value (don't just print!)\n4. Keeps it short (under 20 lines ideally)\n5. Has a docstring explaining what it does\n\n**⚡ JavaScript version:**\n\`\`\`javascript\nconst greet = (name, greeting = "Hello") => {\n    return \`\${greeting}, \${name}!\`;\n};\n\`\`\`${randomEncouragement()}`,
            category: 'concept'
        },
        {
            triggers: ['class', 'oop', 'object oriented', 'inheritance', 'what is a class', 'objects'],
            response: () => `${EMOJIS_BY_TOPIC.concept} **OOP — Object-Oriented Programming!**\n\nThink of a class as a **blueprint** 📐 and objects as things built from that blueprint.\n\n**Real-world analogy:** 🐕\n- **Class** = "Dog" (the concept)\n- **Object** = "Buddy" (a specific dog)\n- **Attributes** = name, breed, age (properties)\n- **Methods** = bark(), fetch(), sit() (actions)\n\n\`\`\`python\nclass Dog:\n    def __init__(self, name, breed):\n        self.name = name     # Attribute\n        self.breed = breed\n    \n    def bark(self):          # Method\n        return f"{self.name} says: Woof! 🐕"\n\n# Create objects\nbuddy = Dog("Buddy", "Golden Retriever")\nmax_dog = Dog("Max", "Husky")\n\nprint(buddy.bark())  # "Buddy says: Woof! 🐕"\n\`\`\`\n\n**🎯 Four Pillars of OOP:**\n1. **Encapsulation** — Bundle data + methods together\n2. **Inheritance** — Child class gets parent's features\n3. **Polymorphism** — Same method, different behavior\n4. **Abstraction** — Hide complexity, show simplicity${randomEncouragement()}`,
            category: 'concept'
        },
        {
            triggers: ['list comprehension', 'list comp', 'comprehension', 'map filter'],
            response: () => `${EMOJIS_BY_TOPIC.performance} **List Comprehensions — Write Elegant Code!**\n\nA compact way to create lists in Python. Think of it as a for-loop in one line!\n\n**Basic pattern:** \`[expression for item in iterable if condition]\`\n\n\`\`\`python\n# ❌ Traditional way\nsquares = []\nfor x in range(10):\n    squares.append(x ** 2)\n\n# ✅ List comprehension (same result, 3x cleaner!)\nsquares = [x ** 2 for x in range(10)]\n\n# With filtering\neven_squares = [x ** 2 for x in range(10) if x % 2 == 0]\n# → [0, 4, 16, 36, 64]\n\n# Nested comprehension\nmatrix = [[1, 2], [3, 4]]\nflat = [val for row in matrix for val in row]\n# → [1, 2, 3, 4]\n\`\`\`\n\n💡 **Rule of thumb:** If your comprehension is hard to read, use a regular for-loop instead. Readability counts! 📖${randomEncouragement()}`,
            category: 'concept'
        },
        {
            triggers: ['api', 'what is an api', 'rest api', 'how do apis work', 'fetch data'],
            response: () => `${EMOJIS_BY_TOPIC.concept} **APIs — How Programs Talk to Each Other!**\n\nAn API (Application Programming Interface) is like a **menu at a restaurant** 🍽️:\n- You (the client) look at the menu (API docs)\n- You place an order (make a request)\n- The kitchen (server) prepares your food (processes data)\n- You get your meal (receive a response)\n\n**Making API calls in JavaScript:**\n\`\`\`javascript\n// Fetch data from an API\nconst response = await fetch("https://api.example.com/users");\nconst users = await response.json();\nconsole.log(users);\n\n// Send data to an API\nconst response = await fetch("https://api.example.com/users", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({ name: "Alice", age: 25 })\n});\n\`\`\`\n\n**HTTP Methods (think CRUD):**\n| Method | Action | Example |\n|--------|--------|---------|\n| GET    | Read   | Get all users |\n| POST   | Create | Add a user |\n| PUT    | Update | Edit a user |\n| DELETE | Remove | Delete a user |${randomEncouragement()}`,
            category: 'concept'
        },

        // ═══ Debugging & Fix ═══
        {
            triggers: ['fix', 'debug', 'not working', 'broken', 'wrong output', 'help me fix', 'bug in my code'],
            response: (code) => {
                const hasCode = code && code.trim().length > 20;
                let resp = `${EMOJIS_BY_TOPIC.debug} **Let's debug this together!**\n\n`;

                if (hasCode) {
                    resp += `I can see you have code in the editor! Here's what I recommend:\n\n`;
                    resp += `1. **Click "Analyze Code"** to get a detailed report of issues\n`;
                    resp += `2. **Click "Run Code"** to see the actual output\n`;
                    resp += `3. Check the error messages — they tell you the exact line!\n\n`;
                } else {
                    resp += `**Paste your code** in the editor so I can take a look!\n\n`;
                }

                resp += `**🔍 Systematic debugging approach:**\n`;
                resp += `1. **Read the error message** — it usually tells you WHAT and WHERE\n`;
                resp += `2. **Check the line BEFORE** the error line (the real bug is often there)\n`;
                resp += `3. **Add print/console.log** statements to track variable values\n`;
                resp += `4. **Test with simple input** first, then complex cases\n`;
                resp += `5. **Rubber duck it** — explain your code line by line out loud 🦆\n\n`;
                resp += `💡 The best debuggers don't write bug-free code — they're just great at finding bugs!`;
                return resp;
            },
            category: 'debug'
        },

        // ═══ Code-Specific Context ═══
        {
            triggers: ['my code', 'this code', 'the code', 'analyze my', 'look at my', 'check my code', 'review my code'],
            response: (code) => {
                if (!code || code.trim().length < 10) {
                    return "I'd love to help with your code! 😊 But it looks like the editor is empty.\n\n**Try this:**\n1. Paste your code in the editor on the left\n2. Click **Analyze Code** for a detailed report\n3. Then ask me about specific issues!\n\nOr load a sample to see how it works! 🚀";
                }

                const lines = code.split('\n').length;
                const hasFunction = /def |function |const \w+ = \(/.test(code);
                const hasLoop = /for |while |\.forEach|\.map/.test(code);
                const hasClass = /class /.test(code);

                let analysis = `I can see your code! 📝 Here's a quick overview:\n\n`;
                analysis += `📊 **Stats:** ${lines} lines`;
                if (hasFunction) analysis += ` · Has functions`;
                if (hasLoop) analysis += ` · Uses loops`;
                if (hasClass) analysis += ` · Has classes`;
                analysis += `\n\n`;
                analysis += `**For a detailed analysis:**\n`;
                analysis += `1. Click the **"Analyze Code"** button for a full report with scores\n`;
                analysis += `2. Click **"Run Code"** to see the output\n`;
                analysis += `3. Check the **Refactoring** page for improvement suggestions\n\n`;
                analysis += `Or ask me about a specific concept used in your code! I'm here to help 💜`;
                return analysis;
            },
            category: 'code'
        },

        // ═══ Motivational & Learning ═══
        {
            triggers: ['i\'m stuck', 'i\'m confused', 'don\'t understand', 'too hard', 'i can\'t', 'give up', 'frustrated'],
            response: () => randomPick([
                "Hey, don't worry! 🤗 Every expert was once a beginner. The fact that you're trying means you're already making progress!\n\n**Here's what helped many beginners:**\n1. Break the problem into tiny steps\n2. Get the simplest version working first\n3. Add one feature at a time\n4. It's OK to look things up — pros do it all the time!\n\nTell me specifically what's confusing and we'll work through it together! 💪",
                "I totally get it! 😊 Programming CAN be frustrating sometimes. But here's a secret:\n\n**Every bug you fix makes you a better developer.** 🦋\n\nLet's take a step back:\n1. What are you trying to do? (in plain English)\n2. What's happening instead?\n3. What did you expect to happen?\n\nAnswer these and we'll solve it together! 🤝",
                "It's completely normal to feel stuck! 🙌 Even senior developers Google things 50 times a day!\n\n**Quick mindset shift:**\n- You're not \"bad at coding\" — you're LEARNING 📚\n- Errors aren't failures — they're the computer telling you what to fix 🔧\n- Every \"I don't know\" is an opportunity to learn something new ✨\n\nWhat specific part is tricky? Let's break it down together!"
            ]),
            category: 'motivation'
        },

        // ═══ Quick Tips by Language ═══
        {
            triggers: ['python tip', 'python trick', 'python shortcut', 'python beginner'],
            response: () => `${EMOJIS_BY_TOPIC.python} **Python Tips & Tricks!**\n\n\`\`\`python\n# 1. F-strings (Python 3.6+)\nname = "Alice"\nprint(f"Hello, {name}!")  # Clean string formatting\n\n# 2. Multiple assignment\na, b, c = 1, 2, 3\na, b = b, a  # Swap values!\n\n# 3. Ternary operator\nstatus = "even" if n % 2 == 0 else "odd"\n\n# 4. Unpacking\nfirst, *rest = [1, 2, 3, 4, 5]\n# first = 1, rest = [2, 3, 4, 5]\n\n# 5. Dictionary comprehension\nsquares = {x: x**2 for x in range(6)}\n\n# 6. enumerate() for index + value\nfor i, item in enumerate(["a", "b", "c"]):\n    print(f"{i}: {item}")\n\n# 7. zip() to iterate in parallel\nnames = ["Alice", "Bob"]\nages = [25, 30]\nfor name, age in zip(names, ages):\n    print(f"{name} is {age}")\n\`\`\`\n\n💡 Python's motto: "There should be one obvious way to do it!" — The Zen of Python${randomEncouragement()}`,
            category: 'tip'
        },
        {
            triggers: ['javascript tip', 'js tip', 'javascript trick', 'js beginner'],
            response: () => `${EMOJIS_BY_TOPIC.javascript} **JavaScript Tips & Tricks!**\n\n\`\`\`javascript\n// 1. Destructuring\nconst { name, age } = user;\nconst [first, ...rest] = array;\n\n// 2. Optional chaining\nconst city = user?.address?.city ?? "Unknown";\n\n// 3. Template literals\nconst msg = \`Hello, \${name}! You are \${age} years old.\`;\n\n// 4. Spread operator\nconst merged = { ...obj1, ...obj2 };\nconst combined = [...arr1, ...arr2];\n\n// 5. Arrow functions\nconst double = (x) => x * 2;\nconst greet = (name) => \`Hi, \${name}!\`;\n\n// 6. Array methods chain\nconst results = data\n    .filter(item => item.active)\n    .map(item => item.name)\n    .sort();\n\n// 7. Short-circuit evaluation\nconst value = input || "default";\nconst result = condition && doSomething();\n\`\`\`\n\n💡 Always use \`const\` by default, \`let\` when mutation is needed, never \`var\`!${randomEncouragement()}`,
            category: 'tip'
        },

        // ═══ General Knowledge ═══
        {
            triggers: ['what is', 'explain', 'how does', 'what does', 'tell me about', 'describe'],
            response: () => `I'd love to explain! 😊 Could you be a bit more specific? I can help with:\n\n📖 **Concepts:**\n• "What is a variable?" / "Explain loops" / "How do classes work?"\n\n🔴 **Errors:**\n• "What is a null pointer?" / "Explain syntax error"\n\n⚡ **Performance:**\n• "How to optimize loops?" / "What is Big O?"\n\n🎨 **Best Practices:**\n• "PEP 8 guidelines" / "How to write clean code?"\n\n🐛 **Debugging:**\n• "How to debug my code?" / "Why is my function returning None?"\n\nJust ask! No question is too simple! 💜`,
            category: 'general'
        },
    ],

    // ─── Smart Fallback ───
    fallback: () => randomPick([
        `Hmm, I'm not sure about that one! 🤔 But I'm always learning!\n\nHere are things I'm great at:\n• 🔴 **Error messages** — paste any error\n• 🐛 **Debugging** — "why is my code broken?"\n• 💡 **Concepts** — "explain recursion"\n• ⚡ **Tips** — "Python tips" or "JS tricks"\n• 🎨 **Best practices** — "clean code tips"\n\nTry rephrasing your question, or paste your code in the editor! 🚀`,
        `That's an interesting question! 🤓 I might not have the perfect answer, but try asking me:\n\n• "How do I fix [error name]?"\n• "Explain [concept] with examples"\n• "Tips for [language]"\n• "How to make my code faster"\n\nOr paste your code and ask me about it! I love looking at code! 💜`,
        `I'm still learning about that! 🌱 But here's what I DO know really well:\n\n🐍 Python concepts & debugging\n⚡ JavaScript tips & tricks\n☕ Java basics\n📚 Programming fundamentals\n🎨 Code style & best practices\n\nTry asking about any of these! 😊`
    ])
};

// ─── Main Response Function ───
export function getChatResponse(userMessage, codeContext = '') {
    const msg = userMessage.toLowerCase().trim();

    // Empty message
    if (!msg) return "Type something and I'll help! 😊";

    // Search knowledge base (patterns)
    for (const pattern of knowledgeBase.patterns) {
        for (const trigger of pattern.triggers) {
            if (msg.includes(trigger)) {
                const resp = typeof pattern.response === 'function'
                    ? pattern.response(codeContext)
                    : pattern.response;
                return resp;
            }
        }
    }

    // Smart fallback with code context awareness
    if (codeContext && codeContext.trim().length > 20) {
        if (msg.length < 15) {
            return `I see you have code in the editor! 📝 Try being more specific — for example:\n\n• "Is my code correct?"\n• "How can I improve it?"\n• "Explain the error I'm getting"\n\nOr click **"Analyze Code"** for a full report! 🔍`;
        }
    }

    // Fallback
    return typeof knowledgeBase.fallback === 'function'
        ? knowledgeBase.fallback()
        : knowledgeBase.fallback;
}

// ─── Quick Suggestions (contextual) ───
export function getQuickSuggestions(codeContext = '') {
    const base = [
        '💡 Tips for clean code',
        '🐛 Help me debug',
        '🐍 Python tips',
        '⚡ JavaScript tips',
        '🤣 Tell me a joke',
    ];

    if (codeContext && codeContext.trim().length > 20) {
        return [
            '🔍 Check my code',
            '🐛 Why is this broken?',
            ...base.slice(0, 3)
        ];
    }

    const extras = [
        '🔄 Explain recursion',
        '📚 What is OOP?',
        '⚡ How to optimize loops?',
    ];

    return [...base, ...extras.slice(0, 2)];
}

// ─── Reaction Emojis ───
export function getReactionForCategory(category) {
    const reactions = {
        greeting: ['👋', '😊', '🎉'],
        farewell: ['👋', '🚀', '💜'],
        thanks: ['💜', '🤗', '✨'],
        error: ['🔧', '💪', '🛠️'],
        debug: ['🐛', '🔍', '💡'],
        concept: ['📚', '💡', '🧠'],
        performance: ['⚡', '🚀', '📈'],
        style: ['🎨', '✨', '💎'],
        fun: ['😄', '😂', '🤣'],
        motivation: ['💪', '🌟', '🤗'],
        tip: ['💡', '⚡', '✨'],
        code: ['📝', '🔍', '💻'],
        identity: ['🤖', '✨', '💜'],
        smalltalk: ['😊', '🤗', '✨'],
        general: ['💡', '📖', '🔍'],
    };
    return reactions[category] || ['👍', '💡', '🔍'];
}
