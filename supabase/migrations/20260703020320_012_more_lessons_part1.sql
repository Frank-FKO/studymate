/*
# Add more lessons across subjects - Part 1: Chemistry and Biology
*/

-- Chemistry: Atomic Structure
INSERT INTO lessons (subject_id, title, slug, description, difficulty, estimated_minutes, objectives, simple_explanation, detailed_explanation, examples, common_mistakes, memory_tips, practice_questions, summary, order_index) VALUES
((SELECT id FROM subjects WHERE slug = 'chemistry'), 'Atomic Structure', 'atomic-structure', 'Understand the building blocks of matter', 'beginner', 20,
'["Identify subatomic particles", "Understand atomic number and mass", "Draw electron configurations"]',
'Atoms are like tiny solar systems. At the center is the nucleus containing protons (positive) and neutrons (neutral). Electrons (negative) orbit around in shells.',
'An atom consists of a nucleus containing protons and neutrons, surrounded by electrons in energy levels or shells. The atomic number equals the number of protons, which defines the element. The mass number is protons plus neutrons. Electrons are arranged in shells: 2 electrons can fit in the first shell, 8 in the second and third. The electron configuration determines how atoms bond with each other.',
'[{"title": "Hydrogen Atom", "content": "The simplest atom: 1 proton, 0 neutrons, 1 electron. This is why hydrogen has atomic number 1."}, {"title": "Carbon Atom", "content": "6 protons, 6 neutrons, 6 electrons. Electronic configuration: 2,4. Can form 4 bonds."}]',
'["Confusing atomic number with mass number", "Forgetting that atoms are neutral", "Thinking electrons are in the nucleus"]',
'["Protons Positive, Neutrons Neutral, Electrons tiny Negative", "Atomic number = Protons = Electrons in a neutral atom", "Mass number = Protons + Neutrons"]',
'[{"question": "How many protons are in an oxygen atom (atomic number 8)?", "answer": "8 protons. The atomic number equals the number of protons."}, {"question": "What is the electron configuration of lithium (atomic number 3)?", "answer": "2,1. Two electrons in the first shell, one in the second shell."}, {"question": "How many neutrons does carbon-14 have?", "answer": "8 neutrons. Carbon has 6 protons. Mass number 14 - 6 protons = 8 neutrons."}]',
'Atoms are the fundamental building blocks of matter. Understanding atomic structure helps explain chemical reactions and the periodic table.',
1);

-- Chemistry: Chemical Bonding  
INSERT INTO lessons (subject_id, title, slug, description, difficulty, estimated_minutes, objectives, simple_explanation, detailed_explanation, examples, common_mistakes, memory_tips, practice_questions, summary, order_index) VALUES
((SELECT id FROM subjects WHERE slug = 'chemistry'), 'Chemical Bonding', 'chemical-bonding', 'Learn how atoms combine to form compounds', 'intermediate', 25,
'["Explain ionic and covalent bonds", "Predict bond types from electronegativity", "Draw Lewis dot structures"]',
'Atoms bond to achieve stable electron configurations. Ionic bonds involve electron transfer. Covalent bonds involve electron sharing.',
'Chemical bonding occurs because atoms seek stable electron configurations with full outer shells. Ionic bonding happens when electrons transfer from a metal to a nonmetal, creating oppositely charged ions. The electronegativity difference between atoms determines bond type. Covalent bonds can be polar or nonpolar. Lewis dot structures show valence electrons and help predict bonding patterns.',
'[{"title": "Table Salt (NaCl)", "content": "Sodium gives one electron to chlorine. Na becomes Na+, Cl becomes Cl-. Ionic bond forms."}, {"title": "Water (H2O)", "content": "Oxygen shares electrons with two hydrogen atoms. Polar covalent bonds form."}]',
'["Thinking ionic bonds share electrons", "Forgetting that metals lose electrons in ionic bonds", "Not distinguishing between polar and nonpolar covalent bonds"]',
'["Ionic: electron transfer", "Covalent: electron sharing", "Like dissolves like"]',
'[{"question": "What type of bond forms between K and Cl?", "answer": "Ionic bond. Metal and nonmetal transfer electrons."}, {"question": "Draw the Lewis structure for H2O", "answer": "O in middle with 2 lone pairs, H on each side sharing electrons."}, {"question": "Is the C-H bond ionic, polar covalent, or nonpolar covalent?", "answer": "Nonpolar covalent. Carbon and hydrogen have similar electronegativities."}]',
'Chemical bonds hold atoms together in compounds. Understanding bonding helps predict molecular shapes and properties.',
2);

-- Biology: Cell Structure
INSERT INTO lessons (subject_id, title, slug, description, difficulty, estimated_minutes, objectives, simple_explanation, detailed_explanation, examples, common_mistakes, memory_tips, practice_questions, summary, order_index) VALUES
((SELECT id FROM subjects WHERE slug = 'biology'), 'Cell Structure', 'cell-structure', 'Explore the building blocks of life', 'beginner', 20,
'["Identify cell organelles", "Compare plant and animal cells", "Explain cell membrane function"]',
'Cells are like tiny factories. The nucleus is the control center, mitochondria are power plants, the cell membrane is the security gate.',
'Cells are the basic unit of life. All cells have a cell membrane, cytoplasm, DNA, and ribosomes. Eukaryotic cells have a nucleus and membrane-bound organelles. Mitochondria produce energy, the endoplasmic reticulum transports materials, the Golgi apparatus packages proteins. Plant cells have additional structures: a cell wall, chloroplasts, and a large central vacuole.',
'[{"title": "Muscle Cells", "content": "Have many mitochondria to provide energy for movement."}, {"title": "Leaf Cells", "content": "Packed with chloroplasts to maximize photosynthesis."}]',
'["Thinking all cells are the same", "Forgetting that plant cells have a cell wall AND a cell membrane", "Confusing mitochondria with chloroplasts"]',
'["Nucleus = CEO of the cell", "Mitochondria = Powerhouse", "Ribosomes = Protein factories", "Plant cells: Wall, Chloroplasts, Vacuole"]',
'[{"question": "What organelle produces energy for the cell?", "answer": "Mitochondria. They perform cellular respiration to make ATP."}, {"question": "Name three differences between plant and animal cells", "answer": "Plant cells have: cell wall, chloroplasts, large central vacuole."}, {"question": "What is the function of ribosomes?", "answer": "Ribosomes synthesize proteins using instructions from mRNA."}]',
'Cells are complex structures optimized for their functions. Understanding cell biology explains how organisms grow and maintain life.',
1);

-- Biology: DNA and Genetics
INSERT INTO lessons (subject_id, title, slug, description, difficulty, estimated_minutes, objectives, simple_explanation, detailed_explanation, examples, common_mistakes, memory_tips, practice_questions, summary, order_index) VALUES
((SELECT id FROM subjects WHERE slug = 'biology'), 'DNA and Genetics', 'dna-genetics', 'Understand the genetic code of life', 'intermediate', 25,
'["Explain DNA structure and function", "Transcribe DNA to mRNA", "Understand basic Mendelian genetics"]',
'DNA is a twisted ladder made of four bases: A, T, G, C. The sequence of these bases is the genetic code. A always pairs with T; G always pairs with C.',
'DNA stores genetic information in the sequence of four bases: Adenine, Thymine, Guanine, and Cytosine. The bases pair specifically: A with T, G with C. Gene expression involves transcription and translation. In genetics, alleles are different versions of genes. Dominant alleles mask recessive alleles.',
'[{"title": "Eye Color", "content": "Brown eyes are dominant over blue."}, {"title": "Sickle Cell", "content": "Demonstrates codominance."}]',
'["Confusing genotype with phenotype", "Thinking dominant is always more common", "Forgetting that mRNA has U instead of T"]',
'["A pairs with T, G pairs with C", "DNA to mRNA: T becomes U", "Use Punnett squares for crosses"]',
'[{"question": "If DNA sequence is ATG-CCA, what is the complementary strand?", "answer": "TAC-GGT. A pairs with T, G pairs with C."}, {"question": "Two heterozygous parents (Bb) are crossed. What ratio of offspring are bb?", "answer": "25% or 1/4. Bb x Bb gives: 25% BB, 50% Bb, 25% bb."}]',
'DNA carries hereditary information through its base sequence. Understanding genetics explains inheritance and genetic disorders.',
2);