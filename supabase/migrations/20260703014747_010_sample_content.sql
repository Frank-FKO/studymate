/*
# Add sample lessons and quizzes for testing
*/

-- Mathematics Lessons
INSERT INTO lessons (subject_id, title, slug, description, difficulty, estimated_minutes, objectives, simple_explanation, detailed_explanation, examples, common_mistakes, memory_tips, practice_questions, summary, order_index) VALUES
((SELECT id FROM subjects WHERE slug = 'mathematics'), 'Introduction to Algebra', 'intro-algebra', 'Learn the basics of algebraic expressions and equations', 'beginner', 15,
'["Understand what variables are", "Learn to simplify expressions", "Solve basic linear equations"]',
'Algebra is like a puzzle where letters stand for numbers. Instead of just adding 2 + 3, we use letters like x and y to represent unknown values.',
'Algebra uses letters (variables) to represent unknown numbers. An expression like 2x + 3 means "2 times some number x, plus 3". An equation like 2x + 3 = 11 means we need to find what x makes this true. To solve: 2x = 11 - 3 = 8, so x = 4. The key rules are: 1) Keep the equation balanced - whatever you do to one side, do to the other. 2) Combine like terms (terms with the same variable). 3) Isolate the variable to find its value.',
'[{"title": "Shopping Example", "content": "If apples cost $2 each and you buy x apples plus a $3 bag, the total cost is 2x + 3. If you spent $11, then 2x + 3 = 11, meaning x = 4 apples."}, {"title": "Video Game Example", "content": "In a game, you gain 5 points per level and start with 10 bonus points. Your total score is 5x + 10. If your score is 60, then x = 10 levels completed."}]',
'["Forgetting to do the same operation to both sides", "Mixing up the order of operations", "Not distributing negative signs correctly", "Adding unlike terms (x and x² are different)"]',
'["Whatever you do to one side, do to the other - like a balance scale", "PEMDAS: Parentheses, Exponents, Multiply/Divide, Add/Subtract", "Like terms have the same variable and power: 3x and 5x can combine, but 3x and 3x² cannot"]',
'[{"question": "Solve: 2x + 5 = 13", "answer": "x = 4. Subtract 5 from both sides: 2x = 8. Divide by 2: x = 4."}, {"question": "Simplify: 3x + 2x - 5", "answer": "5x - 5. Combine like terms 3x and 2x to get 5x."}, {"question": "Solve: x/3 = 6", "answer": "x = 18. Multiply both sides by 3."}]',
'Mastering algebra basics opens the door to all higher mathematics. Remember: keep equations balanced, combine like terms, and isolate the variable step by step.',
1),

((SELECT id FROM subjects WHERE slug = 'mathematics'), 'Linear Equations', 'linear-equations', 'Master solving and graphing linear equations', 'intermediate', 20,
'["Solve multi-step linear equations", "Graph linear equations on a coordinate plane", "Understand slope and y-intercept"]',
'A linear equation makes a straight line when graphed. The form y = mx + b tells you everything: m is the slope (steepness) and b is where the line crosses the y-axis.',
'y = mx + b is called slope-intercept form. The slope (m) tells you how steep the line is - rise over run. A slope of 2 means go up 2 units for every 1 unit right. The y-intercept (b) is where x = 0. To graph: 1) Start at the y-intercept, 2) Use slope to find another point, 3) Draw the line. To find slope from two points: m = (y2-y1)/(x2-x1).',
'[{"title": "Real-World Slope", "content": "A ramp rising 3 feet over 10 feet horizontal has slope 3/10 = 0.3. In y = 0.3x form, if you walk 20 feet horizontally, you rise y = 0.3(20) = 6 feet."}, {"title": "Saving Money", "content": "Starting with $50 and saving $20/week: y = 20x + 50. After 4 weeks, y = 20(4) + 50 = $130."}]',
'["Confusing rise over run with run over rise", "Forgetting that parallel lines have the same slope", "Mixing up x and y coordinates when plotting", "Not recognizing vertical lines (undefined slope)"]',
'["Slope = Rise/Run = change in y / change in x", "y = mx + b: m tells you direction, b tells you where you start", "Vertical lines: x = a constant (undefined slope)", "Horizontal lines: y = a constant (zero slope)"]',
'[{"question": "Find the slope of the line through points (1,2) and (4,8)", "answer": "m = (8-2)/(4-1) = 6/3 = 2"}, {"question": "Graph y = 2x + 1", "answer": "Start at y-intercept (0,1). Slope 2 means up 2, right 1. Plot (1,3). Draw line through points."}, {"question": "Write the equation with slope 3 and y-intercept -2", "answer": "y = 3x - 2"}]',
'Linear equations are fundamental for understanding relationships between variables. The slope-intercept form y = mx + b makes graphing and predicting values straightforward.',
2);

-- Physics Lessons  
INSERT INTO lessons (subject_id, title, slug, description, difficulty, estimated_minutes, objectives, simple_explanation, detailed_explanation, examples, common_mistakes, memory_tips, practice_questions, summary, order_index) VALUES
((SELECT id FROM subjects WHERE slug = 'physics'), 'Newton Laws of Motion', 'newton-laws', 'Understand the three fundamental laws governing motion', 'beginner', 25,
'["State and explain Newton three laws", "Apply F = ma to solve problems", "Understand action-reaction pairs"]',
'Newton three laws explain how forces affect motion: 1) Objects keep doing what they are doing unless pushed, 2) Force = mass times acceleration, 3) Every action has an equal opposite reaction.',
'First Law (Inertia): An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by an unbalanced force. Second Law: F = ma. The acceleration of an object depends on the force applied and its mass. Double the force = double the acceleration. Double the mass = half the acceleration. Third Law: For every action force, there is an equal and opposite reaction force. These forces act on different objects.',
'[{"title": "Seatbelt Example", "content": "When a car stops suddenly, your body keeps moving forward (First Law). The seatbelt provides the force to stop you."}, {"title": "Kicking a Ball", "content": "A 0.5 kg ball kicked with 10 N of force accelerates at a = F/m = 10/0.5 = 20 m/s² (Second Law)."}, {"title": "Swimming", "content": "You push water backward, water pushes you forward with equal force (Third Law)."}]',
'["Thinking mass affects the action-reaction pair", "Forgetting that action and reaction act on different objects", "Confusing velocity and acceleration", "Applying F = ma without considering direction"]',
'["First Law: Things are lazy - they keep doing what they are doing", "Second Law: F = ma - Big force on small mass = big acceleration", "Third Law: You push the wall, the wall pushes you back equally harder"]',
'[{"question": "A 2 kg object experiences 10 N of force. What is the acceleration?", "answer": "a = F/m = 10/2 = 5 m/s²"}, {"question": "Why does a rocket move upward?", "answer": "Hot gases push downward (action), gases push rocket upward (reaction)"}, {"question": "A book rests on a table. What forces act on it?", "answer": "Gravity pulls down, table pushes up with equal normal force. Net force = 0."}]',
'Newton laws form the foundation of classical mechanics. Every motion problem can be traced back to these three fundamental principles.',
1),

((SELECT id FROM subjects WHERE slug = 'physics'), 'Energy and Work', 'energy-work', 'Learn about kinetic energy, potential energy, and work', 'intermediate', 20,
'["Calculate work done by a force", "Apply kinetic and potential energy formulas", "Use conservation of energy"]',
'Energy is the ability to do work. Work is force times distance. Kinetic energy is energy of motion, potential energy is stored energy based on position.',
'Work = Force × Distance × cos(θ) where θ is the angle between force and displacement. Only the component of force in the direction of motion does work. Kinetic Energy (KE) = ½mv² - depends on mass and speed squared. Potential Energy (PE) = mgh - depends on height. Conservation of Energy: Energy cannot be created or destroyed, only transformed. Total mechanical energy = KE + PE remains constant in absence of friction.',
'[{"title": "Roller Coaster", "content": "At the top of a hill: mostly PE. At the bottom: mostly KE. Total energy stays constant."}, {"title": "Lifting a Box", "content": "Lifting a 20 kg box 2 m requires Work = mgh = 20×9.8×2 = 392 J. This becomes PE of the box."}]',
'["Thinking work is done when force is applied but no movement", "Forgetting that work is a scalar (no direction)", "Confusing force and energy units", "Not considering the angle in Work = Fdcos(θ)"]',
'["Work units: Joules = Newtons × meters", "KE = ½mv² - double speed = 4× energy", "PE = mgh - height matters, path does not", "Energy is conserved - it just changes forms"]',
'[{"question": "A 5 kg ball moves at 4 m/s. What is its kinetic energy?", "answer": "KE = ½(5)(4)² = ½(5)(16) = 40 J"}, {"question": "How much work to lift a 10 kg box 3 m?", "answer": "W = mgh = 10×9.8×3 = 294 J"}, {"question": "A ball falls from 5 m. What speed does it hit the ground?", "answer": "PE = KE, mgh = ½mv², v = √(2gh) = √(2×9.8×5) = 9.9 m/s"}]',
'Energy is a powerful concept because it is conserved. Using energy methods often simplifies problems that would be difficult with Newton laws alone.',
2);

-- Insert quizzes
INSERT INTO quizzes (subject_id, title, description, difficulty, time_limit, passing_score, questions) VALUES
((SELECT id FROM subjects WHERE slug = 'mathematics'), 'Algebra Basics Quiz', 'Test your understanding of basic algebraic concepts', 'easy', 600, 70,
'[{"id": "q1", "question": "Solve for x: 3x = 15", "type": "multiple_choice", "options": ["3", "5", "15", "45"], "correct_answer": "5", "explanation": "Divide both sides by 3: x = 15/3 = 5", "difficulty": "easy", "points": 10}, {"id": "q2", "question": "Simplify: 2x + 3x", "type": "multiple_choice", "options": ["5x", "5x²", "6x", "5"], "correct_answer": "5x", "explanation": "Add the coefficients: 2 + 3 = 5, keeping the same variable x", "difficulty": "easy", "points": 10}, {"id": "q3", "question": "What is the slope of y = 2x + 3?", "type": "multiple_choice", "options": ["2", "3", "5", "6"], "correct_answer": "2", "explanation": "In y = mx + b form, m is the slope. Here m = 2", "difficulty": "easy", "points": 10}]'),

((SELECT id FROM subjects WHERE slug = 'physics'), 'Newton Laws Quiz', 'Test your understanding of Newton three laws of motion', 'easy', 600, 70,
'[{"id": "q1", "question": "What does Newton First Law describe?", "type": "multiple_choice", "options": ["F = ma", "Inertia", "Action-Reaction", "Gravity"], "correct_answer": "Inertia", "explanation": "The First Law states that objects resist changes in motion, called inertia", "difficulty": "easy", "points": 10}, {"id": "q2", "question": "A 5 kg object has 20 N of force applied. What is the acceleration?", "type": "multiple_choice", "options": ["4 m/s²", "25 m/s²", "100 m/s²", "15 m/s²"], "correct_answer": "4 m/s²", "explanation": "Using F = ma: a = F/m = 20/5 = 4 m/s²", "difficulty": "easy", "points": 10}, {"id": "q3", "question": "Newton Third Law is about:", "type": "multiple_choice", "options": ["Inertia", "F = ma", "Action-Reaction pairs", "Gravity"], "correct_answer": "Action-Reaction pairs", "explanation": "The Third Law states that every action has an equal and opposite reaction", "difficulty": "easy", "points": 10}]');

-- Insert flashcards
INSERT INTO flashcards (subject_id, front, back, hints, difficulty) VALUES
((SELECT id FROM subjects WHERE slug = 'mathematics'), 'What is the slope formula?', 'm = (y₂ - y₁)/(x₂ - x₁)', '["Rise over run", "Change in y divided by change in x"]', 'easy'),
((SELECT id FROM subjects WHERE slug = 'mathematics'), 'What is the quadratic formula?', 'x = (-b ± √(b²-4ac))/2a', '["Used for ax² + bx + c = 0", "The discriminant tells you the number of solutions"]', 'medium'),
((SELECT id FROM subjects WHERE slug = 'physics'), 'What is Newton Second Law?', 'F = ma (Force equals mass times acceleration)', '["Connects force, mass, and acceleration", "More force = more acceleration"]', 'easy'),
((SELECT id FROM subjects WHERE slug = 'physics'), 'What is the kinetic energy formula?', 'KE = ½mv²', '["Energy of motion", "Depends on mass and velocity squared"]', 'medium');
