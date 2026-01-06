{
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'agent': {
                '()': 'volttron.platform.agent.utils.AgentFormatter',
            },
        },
        'handlers': {
            'rotating': {
                'class': 'logging.handlers.TimedRotatingFileHandler',
                'level': 'DEBUG',
                'formatter': 'agent',
                'filename': '/home/volttron/logs/volttron.log',
                'encoding': 'utf-8',
                'when': 'midnight',
                'backupCount': 10,
            },
        },
        'root': {
            'handlers': ['rotating'],
            'level': 'DEBUG',
        },
    }