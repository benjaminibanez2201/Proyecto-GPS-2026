# Patrocinio de publicaciones

El flujo de patrocinio permite que un arrendador destaque una publicacion desde `Mis publicaciones`.

## Flujo

1. El arrendador presiona el boton con trueno en una publicacion activa.
2. Selecciona un plan de promocion: `1 dia`, `1 semana` o `1 mes`.
3. Confirma el plan y elige medio de pago.
4. Si elige WebPay, se abre una ventana de autorizacion con formulario de tarjeta.
5. Al autorizar el pago, WebPay muestra `Sigue el proceso desde la pagina anterior`.
6. La pagina anterior recibe la aprobacion y activa el plan con el endpoint real:

```http
POST /api/publicacion/:id/patrocinio
```

Payload esperado:

```json
{
  "metodoPago": "webpay",
  "monto": 9990,
  "plan": "destacado_1_semana",
  "vigenciaDias": 7
}
```

La opcion de transferencia sigue siendo una confirmacion dentro de la app y usa el mismo endpoint cuando termina la espera.

## Capturas

Formulario WebPay:

![Formulario WebPay](images/patrocinio-webpay-form.png)

Pago aprobado:

![Pago aprobado WebPay](images/patrocinio-webpay-aprobado.png)
