const supabase = require('./supabase');

async function testConnection() {
    console.log('Testing Supabase connection...');
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('❌ Connection failed:', error.message);
        } else {
            console.log('✅ Connected successfully!');
            console.log('Buckets found:', data.map(b => b.name).join(', '));
            const artifactsBucket = data.find(b => b.name === 'artifacts');
            if (artifactsBucket) {
                console.log('✅ "artifacts" bucket is present and ready.');
            } else {
                console.warn('⚠️ "artifacts" bucket not found! Please create it in your dashboard.');
            }
        }
    } catch (err) {
        console.error('❌ An unexpected error occurred:', err.message);
    }
}

testConnection();
