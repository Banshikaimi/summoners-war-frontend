require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// 🔒 Variables sensibles
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const PORT = process.env.PORT || 3000;

// 🔹 Summoner's War Sky Arena game ID Twitch
const GAME_ID = '489111';

// 🔹 Tag Twitch Français (à récupérer dynamiquement)
const FRENCH_TAG_NAME = 'Français';
let FRENCH_TAG_ID = '';

// Token Twitch
let ACCESS_TOKEN = '';
let TOKEN_EXPIRES_AT = 0;

// Générer un nouveau token Twitch
async function getNewAccessToken() {
  try {
    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token`,
      null,
      {
        params: {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: 'client_credentials'
        }
      }
    );
    ACCESS_TOKEN = response.data.access_token;
    TOKEN_EXPIRES_AT = Date.now() + response.data.expires_in * 1000;
    console.log('Nouveau token Twitch généré');
  } catch (error) {
    console.error('Erreur token Twitch :', error.message);
  }
}

// Vérifie si le token est valide
async function checkToken(req, res, next) {
  if (!ACCESS_TOKEN || Date.now() >= TOKEN_EXPIRES_AT) {
    await getNewAccessToken();
  }
  next();
}

// Obtenir l’ID du tag "Français"
async function getFrenchTagID() {
  if (FRENCH_TAG_ID) return FRENCH_TAG_ID;
  try {
    const response = await axios.get('https://api.twitch.tv/helix/tags/streams', {
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });
    const tag = response.data.data.find(t => t.localization_names.fr === FRENCH_TAG_NAME);
    if (tag) FRENCH_TAG_ID = tag.tag_id;
    console.log('Tag Français ID :', FRENCH_TAG_ID);
  } catch (error) {
    console.error('Erreur récupération tag Français :', error.message);
  }
  return FRENCH_TAG_ID;
}

// Route API pour récupérer les streameurs FR de Summoner's War
app.get('/api/streamers', checkToken, async (req, res) => {
  try {
    const tagId = await getFrenchTagID();
    const response = await axios.get('https://api.twitch.tv/helix/streams', {
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      params: {
        game_id: GAME_ID,
        tag_ids: tagId,
        first: 100
      }
    });

    const streamers = response.data.data.map(stream => ({
      name: stream.user_login,
      displayName: stream.user_name,
      twitchUrl: `https://www.twitch.tv/${stream.user_login}`,
      viewerCount: stream.viewer_count,
      thumbnailUrl: stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180'),
      title: stream.title
    }));

    res.json(streamers);
  } catch (error) {
    console.error('Erreur API Twitch :', error.message);
    res.status(500).json({ error: 'Erreur API Twitch' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
  getNewAccessToken();
});
