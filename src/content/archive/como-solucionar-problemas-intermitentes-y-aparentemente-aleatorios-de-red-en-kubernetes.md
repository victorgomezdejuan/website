---
title: 'Cómo solucionar problemas intermitentes y aparentemente aleatorios de red en Kubernetes'
description: 'En este post te explico solucionar problemas intermitentes y aparentemente aleatorios de red en un entorno de k8s.'
pubDate: 'Oct 6 2024'
---
### Los errores de red también pueden darse en Kubernetes

Éste va a ser un post corto, pero no por ello menos importante que los anteriores.

Recientemente, en el proyecto en el que trabajo actualmente, **empezamos a experimentar problemas de conexión entre diferentes componentes de nuestro entorno de Kubernetes (AKS en nuestro caso) así como de estos con otros componentes/urls externas**. En concreto, los que los desarrolladores veíamos en los logs que tenemos configurados eran excepciones de tipo **System.Net.Sockets.SocketException** con diferentes timeouts dependiendo de la ocasión: 10 segundos, 15, 20, 90...

La verdad, nos volvimos locos probando varias cosas diferentes. Desde regenerar los propios pods de nuestros microservicios hasta revisar los timeouts de los clientes que nos llamaban por si tuvieran algo mal configurado... Pero nada. Cabe destacar que íbamos un poco a ciegas ya que el equipo de desarrolladores no tenemos acceso la configuración de Kubernetes ni tampoco tenemos mucha idea de cómo funciona internamente.

Nosotros, la verdad, estábamos bastante convencidos de que si por ejemplo, en lugar de ser una red "Kubernetes", fuera una red física (o incluso virtual) tradicional, lo primero que siempre se suele hacer en estos casos es revisar y, en su caso, reiniciar o reconfigurar el servidor DNS. Pero, lo dicho, ni somos expertos en Kubernetes ni nos dejan jugar mucho con él.

Cuando estábamos a punto de restaurar todo nuestro entorno Kubernetes (crear un nuevo exactamente igual y comenzar a usar ese), dimos con un thread de GitHub que podía tener una posible solución: [https://github.com/Azure/AKS/issues/1320#issuecomment-555045638.](https://github.com/Azure/AKS/issues/1320#issuecomment-555045638)

Y... ¡Efectivamente! Resulta que AKS tiene unos pods que actuan de forma similar a cómo lo hace un servidor DNS de toda la vida que se llaman coredns. **La solución, en este caso, consiste en regenerar uno a uno todos los pods de coredns**. Y lo de "todos" es muy importante, ya que nosotros teníamos 3, y tras reiniciar 2 de ellos los problemas de conexión seguían ahí. Casualidad o no, no te dejes ni uno 😉.

### Last thoughts

Uno de los primeros pensamientos que me vino a la mente es que si hubieramos regenerado todo el entorno de k8s nuestro problema se hubiera solucionado, pero nos hubieramos quedado sin saber la causa real y sin dar con una solución rápida por si se da el mismo problema en el futuro.

Otra de las cosas que hemos hecho es **añadir proactividad**. Ahora tenemos configurado nuestro entorno para que cuando un pod de coredns comience a tener errores, nos salten alarmas y, si continúa dándolos, se reinicie automáticamente. Gracias a todo esto ahora nuestra aplicación es mucho más robusta 🙂.
