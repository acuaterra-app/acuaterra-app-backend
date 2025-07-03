# Mejoras en Notificaciones FCM - Prioridad Alta

## Problema Identificado
Los usuarios monitores experimentaban retrasos en la recepción de notificaciones de alerta y las notificaciones no aparecían consistentemente en el panel global de notificaciones del dispositivo móvil, a diferencia de los owners que recibían notificaciones inmediatas.

## Solución Implementada

### Archivos Modificados
1. `app/services/notifications/notification.service.js` - Líneas 168-195
2. `app/services/notifications/firebase.service.js` - Líneas 102-129

### Configuraciones Añadidas

#### Android
```javascript
android: {
  priority: 'high',                    // Prioridad alta del mensaje FCM
  notification: {
    priority: 'high',                  // Prioridad alta de la notificación visual
    channel_id: 'alerts',             // Canal específico para alertas
    default_sound: true,               // Sonido por defecto
    default_vibrate_timings: true,     // Vibración por defecto
    notification_priority: 'PRIORITY_HIGH'  // Prioridad del sistema Android
  }
}
```

#### iOS (Apple Push Notification Service)
```javascript
apns: {
  headers: {
    'apns-priority': '10'              // Máxima prioridad en iOS (10 = alta, 5 = normal)
  },
  payload: {
    aps: {
      sound: 'default',                // Sonido por defecto
      'content-available': 1           // Despierta la app si está en background
    }
  }
}
```

#### Web Push
```javascript
webpush: {
  headers: {
    Urgency: 'high'                    // Alta urgencia para web push notifications
  }
}
```

## Beneficios Esperados

### Para Monitores
- ✅ Recepción inmediata de notificaciones de alerta
- ✅ Aparición garantizada en el panel global de notificaciones
- ✅ Activación de sonido y vibración para alertas críticas
- ✅ Comportamiento consistente con los owners

### Para el Sistema
- ✅ Todas las notificaciones de alerta (sensor_alert, power_alert) tienen prioridad alta
- ✅ Mejor experiencia de usuario para notificaciones críticas
- ✅ Compatibilidad multiplataforma (Android, iOS, Web)
- ✅ Configuraciones que se ignoran automáticamente si no son soportadas

## Compatibilidad
- ✅ No rompe funcionalidad existente
- ✅ Configuraciones adicionales son opcionales para FCM
- ✅ Retrocompatible con versiones anteriores de la app móvil
- ✅ Funciona con todos los tipos de notificaciones existentes

## Notas Técnicas
- Las configuraciones de prioridad alta se aplican a TODAS las notificaciones ya que son de alerta
- El `channel_id: 'alerts'` requiere que la app móvil tenga configurado este canal
- Si alguna configuración no es soportada por el dispositivo, FCM la ignora automáticamente
- La prioridad alta puede consumir más batería, pero es apropiada para alertas críticas

## Próximos Pasos para el Despliegue
1. Desplegar el backend con estos cambios
2. Verificar que la app móvil tenga configurado el canal 'alerts' para Android
3. Probar notificaciones con usuarios monitor en dispositivos reales
4. Monitorear logs para confirmar entrega exitosa

## Fecha de Implementación
2025-07-03

## Desarrollador
Sistema de notificaciones - Acuaterra Backend
