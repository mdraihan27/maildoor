import { v4 as uuidv4 } from 'uuid';

/**
 * Attach a unique request ID for tracing / correlation.
 * Uses incoming x-request-id header if present, otherwise generates one.
 */
const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || uuidv4();
  req.id = id;
  res.setHeader('x-request-id', id);
  next();
};

export default requestId;
