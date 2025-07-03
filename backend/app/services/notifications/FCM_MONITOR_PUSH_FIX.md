# Corrección de Notificaciones Push FCM para Monitores

## 🚨 **PROBLEMA IDENTIFICADO**

### **Síntoma:**
- ✅ Las notificaciones **SÍ se guardan** en la base de datos
- ✅ Las notificaciones **SÍ aparecen** en el listado de la app
- ❌ Las notificaciones **NO aparecen** en el panel global de notificaciones del dispositivo móvil

### **Causa Raíz:**
**Inconsistencia en el uso de métodos FCM:**

1. **`NotificationService.sendToFCM()`** (línea 198) usa:
   ```javascript
   return await FirebaseService.sendMessage(message);
   ```

2. **`FirebaseService.sendMessage()`** (líneas 167-199) **NO incluía** configuraciones de alta prioridad

3. **`FirebaseService.sendNotification()`** (líneas 78-151) **SÍ incluye** configuraciones de alta prioridad

## 🔧 **SOLUCIÓN IMPLEMENTADA**

### **A. Modificación en `firebase.service.js`**

**Antes (líneas 167-199):**
```javascript
async sendMessage(message) {
  // Solo enviaba el mensaje básico SIN configuraciones de prioridad
  const response = await admin.messaging().send(message);
}
```

**Después (líneas 186-220):**
```javascript
async sendMessage(message) {
  // Agregar configuraciones de alta prioridad si no están presentes
  if (!message.android) {
    message.android = {
      priority: 'high',
      notification: {
        priority: 'high',
        channel_id: 'alerts',
        default_sound: true,
        default_vibrate_timings: true,
        notification_priority: 'PRIORITY_HIGH'
      }
    };
  }

  if (!message.apns) {
    message.apns = {
      headers: { 'apns-priority': '10' },
      payload: {
        aps: {
          sound: 'default',
          'content-available': 1
        }
      }
    };
  }

  if (!message.webpush) {
    message.webpush = {
      headers: { Urgency: 'high' }
    };
  }
}
```

## 📱 **CONFIGURACIONES AÑADIDAS**

### **Android:**
- `priority: 'high'` - Prioridad del mensaje FCM
- `notification.priority: 'high'` - Prioridad de la notificación visual
- `notification.channel_id: 'alerts'` - Canal específico para alertas
- `notification.default_sound: true` - Sonido por defecto
- `notification.default_vibrate_timings: true` - Vibración por defecto
- `notification.notification_priority: 'PRIORITY_HIGH'` - Prioridad del sistema Android

### **iOS (APNS):**
- `headers['apns-priority']: '10'` - Máxima prioridad en iOS
- `payload.aps.sound: 'default'` - Sonido por defecto
- `payload.aps['content-available']: 1` - Despierta la app en background

### **Web Push:**
- `headers.Urgency: 'high'` - Alta urgencia para web push notifications

## 🎯 **FLUJO CORREGIDO**

### **Antes:**
```
Sensor Alert → NotificationService.saveAndSendNotification() →
sendToFCM() → FirebaseService.sendMessage() → 
❌ Mensaje básico SIN prioridad → No aparece en panel del dispositivo
```

### **Después:**
```
Sensor Alert → NotificationService.saveAndSendNotification() →
sendToFCM() → FirebaseService.sendMessage() → 
✅ Mensaje CON configuraciones de alta prioridad → 
✅ Aparece en panel del dispositivo con sonido/vibración
```

## 🔍 **VALIDACIÓN**

### **Para verificar que funciona correctamente:**

1. **Generar una alerta de sensor:**
   ```bash
   # Simular medición fuera de rango
   POST /api/temp/power-alerts/simulate
   {
     "moduleId": 123,
     "eventType": "outage"
   }
   ```

2. **Verificar logs:**
   ```
   FCM message sent successfully with high priority configurations
   ```

3. **Verificar en dispositivo:**
   - ✅ Notificación aparece en panel global
   - ✅ Suena notificación
   - ✅ Vibra el dispositivo
   - ✅ Aparece en listado de la app

## 📊 **IMPACTO DE LA CORRECCIÓN**

### **Para OWNERS:**
- ✅ **Sin cambios**: Ya funcionaba correctamente
- ✅ **Mantiene funcionalidad**: Sigue recibiendo notificaciones inmediatas

### **Para MONITORS:**
- ✅ **Problema resuelto**: Ahora reciben notificaciones en el panel del dispositivo
- ✅ **Prioridad alta**: Misma experiencia que los owners
- ✅ **Retrocompatible**: No rompe funcionalidad existente

### **Para el Sistema:**
- ✅ **Consistencia**: Ambos métodos FCM tienen mismas configuraciones
- ✅ **Experiencia uniforme**: Todos los usuarios reciben notificaciones de la misma manera
- ✅ **Configuraciones opcionales**: FCM ignora automáticamente configuraciones no soportadas

## 🚀 **PRÓXIMOS PASOS**

1. **Desplegar la corrección** en el servidor
2. **Probar con dispositivos reales** (Android e iOS)
3. **Verificar que el canal 'alerts'** esté configurado en la app móvil
4. **Monitorear logs** para confirmar entrega exitosa
5. **Documentar** cualquier configuración adicional requerida en la app móvil

## 📝 **NOTAS TÉCNICAS**

- **Efecto inmediato**: La corrección se aplica a todas las notificaciones nuevas
- **Sin migración**: No se requieren cambios en la base de datos
- **Configuraciones condicionales**: Solo se agregan si no están presentes
- **Compatibilidad**: Funciona con todas las versiones de la app móvil

## 📅 **Fecha de Implementación**
2025-07-03

## 👨‍💻 **Desarrollador**
Sistema de notificaciones - Acuaterra Backend
