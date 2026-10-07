import express from 'express';
import { agentEndpoint } from './ag-ui/endpoint';

const app = express();
app.use(express.json({ limit: '5mb' }));
app.post('/agent', agentEndpoint);

const port = Number(process.env.PORT ?? 8000);
app.listen(port, () => {
  console.log(`Weather agent on http://localhost:${port}/agent`);
});
