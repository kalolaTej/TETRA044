const supabase = require('./services/supabaseClient');

async function clearDatabase() {
  console.log('[database cleanup] clearing all detection logs and notification records...');

  try {
    const { error: notifError } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (notifError) console.warn('Notification clear message:', notifError.message);

    const { error: detError } = await supabase
      .from('detections')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (detError) console.warn('Detection clear message:', detError.message);

    console.log('[database cleanup] successfully wiped all detection feed and notification records from database!');
  } catch (err) {
    console.error('[database cleanup error]:', err.message);
  }
}

clearDatabase();
