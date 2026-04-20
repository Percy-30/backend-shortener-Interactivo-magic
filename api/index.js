import express from 'express';
import cors from 'cors';
import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Upstash Redis
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Middleware
app.use(cors({
    origin: '*', // Allow all for now, or specify: ['https://interactivomagic.ftydownloader.com', 'http://localhost:5173']
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check con Diagnóstico
app.get('/api/v1/health', async (req, res) => {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    const diagnostics = {
        hasUrl: !!redisUrl,
        hasToken: !!redisToken,
        urlPreview: redisUrl ? `${redisUrl.substring(0, 15)}...` : 'NONE',
        nodeVersion: process.version,
        time: new Date().toISOString()
    };

    try {
        if (!redisUrl || !redisToken) {
            return res.status(500).json({
                status: 'error',
                message: 'Variables de entorno faltantes en Vercel',
                diagnostics
            });
        }

        // Test RAW FETCH to see if network/DNS is allowed from Vercel
        let rawFetchStatus = 'unknown';
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const testResp = await fetch(redisUrl, { signal: controller.signal }).catch(e => {
                // Node.js fetch errors often have a .cause property with the real error
                const causeMsg = e.cause ? ` | CAUSE: ${e.cause.message || e.cause.code || e.cause}` : '';
                rawFetchStatus = `fetch_error: ${e.message}${causeMsg}`;
                return null;
            });
            if (testResp) {
                rawFetchStatus = `HTTP_${testResp.status}`;
            }
            clearTimeout(timeoutId);
        } catch (e) {
            rawFetchStatus = `outer_catch: ${e.message}`;
        }
        diagnostics.rawFetchStatus = rawFetchStatus;

        const start = Date.now();
        await redis.ping();
        const duration = Date.now() - start;
        
        res.json({ 
            status: 'ok', 
            database: 'connected', 
            latency: `${duration}ms`,
            timestamp: diagnostics.time,
            diagnostics
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ 
            status: 'error', 
            database: 'disconnected', 
            error: error.message,
            diagnostics,
            tip: 'Verifica que la URL en Vercel sea HTTPS y que el Token sea el REST Token, no el de Redis (ioredis).'
        });
    }
});

// API: Create short link
app.post('/api/v1/shorten', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const id = nanoid(6);
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const short_url = `${protocol}://${host}/${id}`;

        // Set with 30 days expiration (2592000 seconds)
        await redis.set(`link:${id}`, url, { ex: 2592000 });

        console.log(`[Magic Shortener] Created: ${id} (Expires in 30 days) -> ${url.substring(0, 50)}...`);
        res.json({ short_url, id });
    } catch (error) {
        console.error('Error creating link:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// API: Get original link data (for frontend fetching)
app.get('/api/v1/get/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const original_url = await redis.get(`link:${id}`);
        if (original_url) {
            return res.json({ url: original_url });
        }
        res.status(404).json({ error: 'Link no encontrado' });
    } catch (error) {
        console.error('Error fetching link:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Redirect: Get original link (Traditional redirection)
app.get('/:id', async (req, res) => {
    const { id } = req.params;

    // Ignore static files/favicon
    if (id.includes('.')) return res.status(404).end();

    try {
        const original_url = await redis.get(`link:${id}`);

        if (original_url) {
            return res.redirect(original_url);
        }

        res.status(404).send('<h1>Link no encontrado 🪄</h1><p>Esta sorpresa ha expirado o el link es incorrecto.</p>');
    } catch (error) {
        console.error('Error fetching link:', error);
        res.status(500).send('Error en el servicio de magia');
    }
});

app.get('/', (req, res) => {
    res.send('Magic Shortener API is running! 🪄✨');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Export for Vercel
export default app;
