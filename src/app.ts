import express from 'express';
import { openDb } from './database';


const app = express();
const PORT = 3000;

app.use(express.json());

interface Policyholder {
  policyholder_id?: string;
  code: string;
  name: string;
  registration_date: string;
   introducer_code?: string;
   introducer_id?: string;
  l: Array<Policyholder>;
  r: Array<Policyholder>;
}

// Policyholder Query API
app.get('/api/policyholders', async (req, res) => {
   const { code } = req.query;
   
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid code query parameter' });
  }

  try {
    const db = await openDb();
    const policyholder = await db.get<Policyholder | undefined>('SELECT p.*, i.* FROM Introductions i RIGHT JOIN Policyholders p ON i.introduced_id = p.policyholder_id WHERE p.policyholder_id = ?', [code]);

    if (!policyholder) {
      return res.status(404).json({ error: 'Policyholder not found' });
    }

      // Fetch trees recursively
      const l = await getTree(db, code, 'L');
      const r = await getTree(db, code, 'R');

      res.json({
        code: policyholder.policyholder_id,
        name: policyholder.name,
        registration_date: policyholder.registration_date,
        introducer_code: policyholder.introducer_id,  
         l,
         r
      });
  } catch (err) {
     const error = err as Error;
   res.status(500).json({ error: error.message });
}
});

// Top-Level Policyholder Query API
app.get('/api/policyholders/:code/top', async (req, res) => {
   const { code } = req.params;
   const db = await openDb();
  try {
    // Fetch the introducer (upper-level policyholder)
      const introducer = await db.get(`
        SELECT p.*, i.* FROM Policyholders p
        RIGHT JOIN Introductions i ON p.policyholder_id = i.introducer_id
        WHERE i.introduced_id = ?
      `, [code]);
     

      if (!introducer) {
        res.status(404).json({ error: "Introducer not found" });
        return;
      }
     const id: string = introducer.policyholder_id
     const policyholder = await db.get<Policyholder | undefined>('SELECT p.*, i.* FROM Introductions i RIGHT JOIN Policyholders p ON i.introduced_id = p.policyholder_id WHERE p.policyholder_id = ?', [id]);
           if (!policyholder) {
        res.status(404).json({ error: "Introducer not found" });
        return;
      }

      // Fetch the left and right trees for the introducer
      const l = await getTree(db, id, 'L');
      const r = await getTree(db, id, 'R');

      res.json({
        code: introducer.policyholder_id,
        name: introducer.name,
        registration_date: introducer.registration_date,
        introducer_code: policyholder.introducer_id, 
        l,
        r
      });
  } catch (err) {
     const error = err as Error;
    res.status(500).json({ error: error.message });
  }finally {
      await db.close();
    }
});

async function getTree(db: any, code: string, relationship: 'L' | 'R') {
   let result = [];
    const Tree:Policyholder[] = await db.all(`
        SELECT * FROM Policyholders WHERE policyholder_id IN (
          SELECT introduced_id FROM Introductions WHERE introducer_id = ? AND relationship = ?
        )
      `, [code,relationship]);
   
    // init root
  const root = await db.get(`
          SELECT p.*, i.* FROM Introductions i
      JOIN Policyholders p ON i.introduced_id = p.policyholder_id
      WHERE i.introduced_id = ? 
  `, [Tree[0].policyholder_id]);

  if (root) {
    result.push({
      policyholder_id: root.policyholder_id,
      name: root.name,
       registration_date: root.registration_date,
      introducer_id: root.introducer_id
    });
  }

  let toProcess = [Tree[0].policyholder_id];

  while (toProcess.length > 0) {
    const currentId = toProcess.pop();
    const children = await db.all(`
      SELECT p.*,i.* FROM Introductions i
      JOIN Policyholders p ON i.introduced_id = p.policyholder_id
      WHERE i.introducer_id = ? 
    `, [currentId]);

    result = result.concat(children);
    toProcess = toProcess.concat(children.map((child: { policyholder_id: string; }) => child.policyholder_id));
  }

  return result.map(node => ({
    code: node.policyholder_id,
    name: node.name,
    registration_date: node.registration_date,
    introducer_code: node.introducer_id  
  }));
}



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
