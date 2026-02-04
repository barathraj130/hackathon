console.log('--- Initializing Reset Script ---');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
  console.log('🚀 Starting hackathon data reset via Supabase Client...');

  try {
    // 1. Delete dependent data
    // ParticipantCertificate -> Submission -> Team
    
    console.log('🗑️ Deleting Participant Certificates...');
    const { error: certError } = await supabase
      .from('ParticipantCertificate')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (certError) throw certError;

    console.log('🗑️ Deleting Submissions...');
    const { error: subError } = await supabase
      .from('Submission')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (subError) throw subError;

    console.log('🗑️ Deleting Teams...');
    const { error: teamError } = await supabase
      .from('Team')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (teamError) throw teamError;

    console.log('🗑️ Deleting Problem Statements...');
    const { error: probError } = await supabase
      .from('ProblemStatement')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (probError) throw probError;

    // 2. Reset Hackathon Config
    console.log('⚙️ Resetting Hackathon Configuration...');
    const { error: configError } = await supabase
      .from('HackathonConfig')
      .upsert({
        id: 1,
        startTime: null,
        isPaused: true,
        eventEnded: false,
        durationMinutes: 1440,
        allowCertificateDetails: false
      });
    if (configError) throw configError;

    console.log('✅ Hackathon data reset successfully via Supabase Client!');
  } catch (error) {
    console.error('❌ Error during reset:', error.message || error);
  }
}

reset();
