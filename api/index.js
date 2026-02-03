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
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
