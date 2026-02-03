const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Supabase] Missing credentials in .env');
}

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('[Supabase] Storage disabled: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Downloads a file from a URL and uploads it to Supabase Storage.
 * @param {string} fileUrl - The source URL of the file.
 * @param {string} bucket - The Supabase Storage bucket name.
 * @param {string} destinationPath - The path inside the bucket.
 * @returns {Promise<string>} - The public URL of the uploaded file.
 */
async function uploadFileFromUrl(fileUrl, bucket, destinationPath) {
    if (!supabase) {
        throw new Error('Supabase storage is not configured. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to environment variables.');
    }
    try {
        console.log(`[Supabase] Syncing artifact: ${fileUrl} -> ${bucket}/${destinationPath}`);
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(destinationPath, response.data, {
                upsert: true
            });
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(destinationPath);
            
        return publicUrl;
    } catch (err) {
        console.error('[Supabase Upload Error]', err.message);
        throw err;
    }
}

module.exports = { supabase, uploadFileFromUrl };
