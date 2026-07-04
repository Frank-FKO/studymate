/*
# Add more lessons across subjects - Part 2: History, Computer Science, Economics, Psychology
*/

-- History: Ancient Civilizations
INSERT INTO lessons (subject_id, title, slug, description, difficulty, estimated_minutes, objectives, simple_explanation, detailed_explanation, examples, common_mistakes, memory_tips, practice_questions, summary, order_index) VALUES
((SELECT id FROM subjects WHERE slug = 'history'), 'Ancient Civilizations', 'ancient-civilizations', 'Explore the first human civilizations', 'beginner', 20,
'["Identify major early civilizations", "Compare features of early societies", "Understand why civilizations developed near rivers"]',
'Ancient civilizations arose where farming was possible. The first were Sumer, Egypt, Indus Valley, and China. They developed writing, laws, cities, and organized governments.',
'The first civilizations emerged around 3000-1500 BCE after the Agricultural Revolution. Mesopotamia was home to Sumer, where writing and written law codes first appeared. Egypt developed along the Nile River, building pyramids. The Indus Valley civilization had planned cities with drainage systems. China developed along the Yellow River. All four river valley civilizations shared features: fertile land, centralized governments, social hierarchies, and writing systems.',
'[{"title": "Mesopotamia", "content": "Between Tigris and Euphrates rivers. Hammurabi created the first written law code."}, {"title": "Ancient Egypt", "content": "United upper and lower Egypt along the Nile. Built pyramids as tombs."}]',
'["Thinking civilization started everywhere simultaneously", "Forgetting that societies traded with each other", "Assuming all ancient people were primitive"]',
'["River valleys provided: Water, Fertile soil, Transportation", "Remember the BIG 4: Mesopotamia, Egypt, Indus, China", "Writing = Laws = Government = Civilization"]',
'[{"question": "Why did early civilizations develop near rivers?", "answer": "Rivers provided water for farming, fertile soil from flooding, and transportation."}, {"question": "What was cuneiform?", "answer": "A writing system developed in Mesopotamia using wedge-shaped marks on clay tablets."}]',
'Ancient civilizations laid the foundation for human progress. Their innovations shaped all future societies.',
1);

-- Computer Science: Introduction to Programming
INSERT INTO lessons (subject_id, title, slug, description, difficulty, estimated_minutes, objectives, simple_explanation, detailed_explanation, examples, common_mistakes, memory_tips, practice_questions, summary, order_index) VALUES
((SELECT id FROM subjects WHERE slug = 'computer-science'), 'Introduction to Programming', 'intro-programming', 'Learn the fundamentals of coding', 'beginner', 25,
'["Understand variables and data types", "Write basic conditional statements", "Create simple functions"]',
'Programming is giving computers step-by-step instructions. Variables store data like boxes with labels. Conditionals make decisions. Functions are reusable recipes.',
'Programming creates instructions for computers. Variables are named storage locations holding data values. Data types include integers, floats, strings, and booleans. Conditionals allow programs to make decisions using if/else statements. Loops repeat code blocks. Functions encapsulate code into reusable blocks with parameters and return values.',
'[{"title": "Temperature Converter", "content": "A function that takes Celsius as input and returns Fahrenheit."}, {"title": "Login System", "content": "Uses conditionals: if username matches AND password matches, grant access."}]',
'["Using = for comparison instead of ==", "Forgetting semicolons when required", "Not initializing variables before using them"]',
'["Variables are labeled boxes", "Conditionals control flow like traffic lights", "Functions are reusable recipes"]',
'[{"question": "What data type would store a person name?", "answer": "String. Names are text, stored as a string."}, {"question": "What is the difference between = and ==?", "answer": "= is assignment, == is comparison."}, {"question": "Write pseudocode for a function that doubles a number", "answer": "function double(x) { return x * 2 }"}]',
'Programming fundamentals are building blocks of all software. Mastering these enables solving any computational problem.',
1);

-- Computer Science: Data Structures
INSERT INTO lessons (subject_id, title, slug, description, difficulty, estimated_minutes, objectives, simple_explanation, detailed_explanation, examples, common_mistakes, memory_tips, practice_questions, summary, order_index) VALUES
((SELECT id FROM subjects WHERE slug = 'computer-science'), 'Data Structures', 'data-structures', 'Understand how to organize and store data efficiently', 'intermediate', 30,
'["Compare arrays, linked lists, and hash tables", "Choose appropriate data structures for problems", "Analyze time complexity basics"]',
'Data structures organize data for efficient access. Arrays store items in order. Linked lists chain items. Hash tables use keys for instant lookup.',
'Data structures are formats for organizing data. Arrays store elements in contiguous memory for O(1) access but O(n) insertion. Linked lists store nodes with data and pointers. Stacks and queues restrict access patterns. Hash tables map keys to values using a hash function for O(1) lookup. Trees organize data hierarchically. Choosing the right structure impacts performance.',
'[{"title": "To-Do List App", "content": "Use a list or array. Fast iteration, easy to add at end."}, {"title": "Employee Directory", "content": "Use a hash table with employee ID as key for instant lookup."}]',
'["Using arrays when frequent insertions are needed", "Forgetting time complexity when choosing", "Not considering space complexity"]',
'["Array: row of lockers - fast find, slow add", "Hash Table: labeled library - find by label instantly", "Linked List: scavenger hunt - follow from start", "Stack: pancakes - last on, first off"]',
'[{"question": "Which data structure gives O(1) average lookup by key?", "answer": "Hash table. Keys are converted to indices for direct access."}, {"question": "When would you choose a linked list over an array?", "answer": "When you need frequent insertions/deletions but rarely access by position."}, {"question": "What is the LIFO principle?", "answer": "Last In, First Out. Items removed in reverse order of addition."}]',
'Data structures are fundamental to efficient programming. Understanding tradeoffs enables optimal solutions.',
2);

-- Economics: Supply and Demand
INSERT INTO lessons (subject_id, title, slug, description, difficulty, estimated_minutes, objectives, simple_explanation, detailed_explanation, examples, common_mistakes, memory_tips, practice_questions, summary, order_index) VALUES
((SELECT id FROM subjects WHERE slug = 'economics'), 'Supply and Demand', 'supply-demand', 'Understand how markets determine prices', 'beginner', 20,
'["Explain the law of demand", "Explain the law of supply", "Determine equilibrium price and quantity"]',
'Supply and demand determine prices like an auction. Buyers want low prices. Sellers want high prices. Where they meet is equilibrium.',
'The law of demand: as price increases, quantity demanded decreases. The law of supply: as price increases, quantity supplied increases. Equilibrium occurs where supply meets demand. Shifts in demand or supply create new equilibriums. Government interventions like price ceilings and floors create surpluses or shortages.',
'[{"title": "iPhone Prices", "content": "When Apple releases a new iPhone, demand is high. Equilibrium finds the market price."}, {"title": "Gasoline Market", "content": "When oil prices rise, supply shifts, causing higher gas prices."}]',
'["Confusing a shift in demand with movement along the curve", "Thinking equilibrium is always best outcome", "Forgetting that price controls create shortages or surpluses"]',
'["Demand curve goes Down - buyers want lower prices", "Supply curve goes Up - sellers want higher prices", "Equilibrium is where curves intersect", "Shift vs Move: inputs shift, price moves along"]',
'[{"question": "What happens to quantity demanded when price increases?", "answer": "Quantity demanded decreases. People buy less at higher prices."}, {"question": "What creates a shortage?", "answer": "Price ceiling below equilibrium. Quantity demanded exceeds quantity supplied."}, {"question": "How does technology improvement affect supply?", "answer": "Supply shifts right. Better technology reduces costs, producers supply more."}]',
'Supply and demand are foundational tools of economics. They explain market phenomena from prices to resource allocation.',
1);

-- Psychology: Basics of Psychology
INSERT INTO lessons (subject_id, title, slug, description, difficulty, estimated_minutes, objectives, simple_explanation, detailed_explanation, examples, common_mistakes, memory_tips, practice_questions, summary, order_index) VALUES
((SELECT id FROM subjects WHERE slug = 'psychology'), 'Basics of Psychology', 'basics-psychology', 'Introduction to the study of mind and behavior', 'beginner', 20,
'["Define psychology and its scope", "Identify major perspectives in psychology", "Understand research methods"]',
'Psychology studies why we think, feel, and behave as we do. It explores memory, learning, emotions, social interactions, and mental health using scientific methods.',
'Psychology is the scientific study of behavior and mental processes. Major perspectives include biological, behavioral, cognitive, psychodynamic, and humanistic. Research methods include experiments, surveys, case studies, and naturalistic observation. Ethics require informed consent, confidentiality, and protection from harm.',
'[{"title": "Memory Research", "content": "Cognitive psychology studied how people remember: short-term memory holds 7 plus or minus 2 items."}, {"title": "Conditioning", "content": "Behavioral psychology showed how rewards and punishments shape behavior."}]',
'["Confusing psychology with mind reading", "Thinking correlation means causation", "Believing all behavior is conscious"]',
'["Psychology is SCIENCE, not common sense", "Multiple perspectives = multiple truths", "Correlation does not equal causation", "The brain is plastic"]',
'[{"question": "What is the difference between a psychologist and a psychiatrist?", "answer": "Psychologists have PhD/PsyD and provide therapy. Psychiatrists are MDs who can prescribe medication."}, {"question": "What does cognitive psychology study?", "answer": "Mental processes: thinking, memory, attention, problem-solving."}, {"question": "Why is random assignment important in experiments?", "answer": "It ensures groups are equivalent so differences can be attributed to the independent variable."}]',
'Psychology provides scientific insights into human nature. Understanding psychology helps us improve ourselves and society.',
1);