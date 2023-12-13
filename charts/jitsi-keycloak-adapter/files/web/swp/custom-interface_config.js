interfaceConfig.APP_NAME = '{{ .Values.theme.texts.productName }} Videoconference';
interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS = true;
interfaceConfig.DISABLE_PRESENCE_STATUS = true;
interfaceConfig.DISABLE_TRANSCRIPTION_SUBTITLES = true;
interfaceConfig.DISABLE_VIDEO_BACKGROUND = true;
interfaceConfig.ENABLE_DIAL_OUT = false;
interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE = false;
interfaceConfig.RECENT_LIST_ENABLED = false;
interfaceConfig.SHOW_JITSI_WATERMARK = true;
interfaceConfig.JITSI_WATERMARK_LINK = 'https://{{- .Values.global.hosts.univentionCorporateServer }}.{{ .Values.global.domain }}';