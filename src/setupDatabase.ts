import { openDb } from './database';

async function setupDatabase(): Promise<void> {
  const db = await openDb();

  // Update table creation script to use TEXT type for IDs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Policyholders (
      policyholder_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      registration_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Introductions (
      introducer_id TEXT,
      introduced_id TEXT,
      introduction_type CHAR(1),
      relationship CHAR(1),
      FOREIGN KEY (introducer_id) REFERENCES Policyholders(policyholder_id),
      FOREIGN KEY (introduced_id) REFERENCES Policyholders(policyholder_id)
    );
  `);

  console.log('Tables created.');

  // Ensure IDs are quoted as strings
  await db.exec(`
    INSERT INTO Policyholders (policyholder_id, name, registration_date) VALUES
    ('1', 'Alice', '2023-01-01'),
    ('2', 'Bob', '2023-01-02'),
    ('3', 'Carol', '2023-01-03'),
    ('4', 'David', '2023-01-04'),
    ('5', 'Eve', '2023-01-05'),
    ('6', 'Frank', '2023-01-06'),
    ('7', 'Grace', '2023-01-07'),
    ('8', 'Helen', '2023-01-08'),
    ('9', 'Ivan', '2023-01-09'),
    ('10', 'Judy', '2023-01-10'),
    ('11', 'Kyle', '2023-01-11'),
    ('12', 'Laura', '2023-01-12'),
    ('13', 'Mindy', '2023-01-13'),
    ('14', 'Nick', '2023-01-14'),
    ('15', 'Oscar', '2023-01-15'),
    ('16', 'Patty', '2023-01-16'),
    ('17', 'Quinn', '2023-01-17'),
    ('18', 'Rachel', '2023-01-18'),
    ('19', 'Steve', '2023-01-19'),
    ('20', 'Tina', '2023-01-20');

    INSERT INTO Introductions (introducer_id, introduced_id, introduction_type, relationship) VALUES
    ('1', '2', 'D', 'L'),
    ('1', '3', 'D', 'R'),
    ('2', '4', 'D', 'L'),
    ('2', '5', 'D', 'R'),
    ('3', '6', 'D', 'L'),
    ('3', '7', 'D', 'R'),
    ('4', '8', 'D', 'L'),
    ('4', '9', 'D', 'R'),
    ('5', '10', 'D', 'L'),
    ('5', '11', 'D', 'R'),
    ('6', '12', 'I', 'L'),
    ('6', '13', 'I', 'R'),
    ('7', '14', 'I', 'L'),
    ('7', '15', 'I', 'R'),
    ('8', '16', 'I', 'L'),
    ('8', '17', 'I', 'R'),
    ('9', '18', 'I', 'L'),
    ('9', '19', 'I', 'R'),
    ('10', '20', 'I', 'L'),
    ('10', '1', 'I', 'R');
  `);

  console.log('Sample data inserted.');

  await db.close();
}

setupDatabase().catch((err) => {
  console.error('Error setting up database:', err);
});
