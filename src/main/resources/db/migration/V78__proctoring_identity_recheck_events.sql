-- Imtihon davomida serverda davriy shaxs tekshiruvi (SFace) natijalari proktoring jurnaliga yoziladi.
-- Faqat ruxsat etilgan turlar ro'yxati kengaytiriladi; mavjud yozuvlar o'zgarmaydi.
ALTER TABLE proctoring_events DROP CONSTRAINT IF EXISTS ck_proctoring_event_type;
ALTER TABLE proctoring_events ADD CONSTRAINT ck_proctoring_event_type CHECK (type IN (
    'SESSION_STARTED', 'SESSION_ENDED', 'CAMERA_STARTED', 'CAMERA_STOPPED',
    'CAMERA_PERMISSION_DENIED', 'TAB_HIDDEN', 'TAB_VISIBLE', 'WINDOW_BLURRED',
    'WINDOW_FOCUSED', 'NETWORK_OFFLINE', 'NETWORK_ONLINE', 'HEARTBEAT', 'PAGE_EXIT',
    'MICROPHONE_STARTED', 'MICROPHONE_STOPPED', 'MICROPHONE_PERMISSION_DENIED',
    'AUDIO_ACTIVITY', 'FACE_NOT_VISIBLE', 'MULTIPLE_FACES', 'HEAD_TURNED',
    'VISUAL_ANALYSIS_UNAVAILABLE',
    'IDENTITY_VERIFIED', 'IDENTITY_MISMATCH', 'IDENTITY_FACE_NOT_FOUND',
    'IDENTITY_MULTIPLE_FACES', 'IDENTITY_CHECKS_MISSING'
));
