---
title: 'Obtener UNIX timestamp en SQL Server'
description: 'Cómo obtener el timestamp de UNIX (segundos desde el 01-01-1970) en SQL Server sin problemas con fechas futuras.'
pubDate: 'Aug 20 2021'
---
### Timestamp de UNIX: muy útil para el intercambio de fechas

En ocaciones, nos puede ocurrir que tengamos que presentar una API o desarrollar una aplicación distribuida que necesite intercambiar fechas. Este suele ser un tipo de datos muy problemático, tanto por la gran cantidad de formatos diferentes que existen como por las zonas horarias.

Una solución bastante común en estos casos suele ser hacer uso del denominado [**UNIX timestamp**](https://www.unixtimestamp.com/). **Una forma muy útil de enviar y/o recibir fechas entre diferentres aplicaciones**, ya que soluciona ambos potenciales problemas.

### SQL Server no tiene la función UNIX\_TIMESTAMP()

MySQL cuenta con la función [**UNIX\_TIMESTAMP()**](https://www.geeksforgeeks.org/unix_timestamp-function-in-mysql/) para obtener el timestamp UNIX, pero éste no es el caso de SQL Server. Supongo que en la mayoría de casos, los desarrolladores/as optamos por recoger el dato de tipo fecha de la base de datos y transformarlo después en UNIX timestamp en el código de la aplicación (c#, por ejemplo).

Sin embargo, esto a veces no es posible o resultaría demasiado tedioso, pues hemos heredado algún código que hace dificil hacerlo de esta manera. O puede que resulte poco eficiente. De cualquier manera, has de saber que **SQL Server no cuenta con esta función**, y por tanto, una solución lógica puede ser crearte tu propia función en SQL Server que devuelva lo mismo que UNIX\_TIMESTAMP() en MySQL.

### El problema con el tipo INT y las fechas más allá de 2038

De primeras, puede parecer el problema no reviste mucha complejidad, ya que no parece muy difícil sacar los segundos desde el 01-01-1970 hasta la fecha a obtener. Sería algo como esto:

`SELECT DATEDIFF(SECOND, '1970-01-01 00:00:00', FechaAConsultar)`

Sin embargo, esto se complica por el hecho de que **el tipo INT de SQL Server tiene un máximo** y el número de segundos desde el 01-01-1970 hasta una hora concreta del 19-01-2038 alcanza ese máximo (2.147.483.647). **Y la función DATEDIFF devuelve un dato de tipo INT**. Por tanto, para fechas posteriores a esa fecha de 2038, esta consulta genera un error.

Afortunadamente, **a partir de SQL Server 2016 se introdujo la función DATEDIFF\_BIG**, que básicamente hace lo mismo que DATEDIFF pero en este caso sí que devuelve un valor de tipo BIGINT y no tenemos este problema.

Pero.... A veces no tenemos un servidor de base de datos SQL Server con esa versión o posterior, ni posibilidad de actualizarlo. Así que toca echarle imaginación. Y eso es lo que hice para desarrollar la función que finalmente implementé y que te dejo aquí:

```
CREATE FUNCTION [dbo].[UNIX_TIMESTAMP]
( 
    @inputDate DATETIME 
)
RETURNS BIGINT 
AS 
BEGIN
    DECLARE @differenceInDays BIGINT, @result BIGINT;
    SET @differenceInDays = DATEDIFF(DAY, '19700101', @inputDate)
    IF @differenceInDays >= 0
        SET @result = (@differenceInDays * 86400) + DATEDIFF(SECOND, DATEADD(DAY, 0, DATEDIFF(DAY, 0, @inputDate)), @inputDate)
    ELSE
        SET @result = 0
    RETURN @result
END
```

Lo que hago en ella, básicamente, es primero calcular la diferencia en días entre el 01-01-1970 y la fecha a consultar y lo paso a segundos, y luego calculo los segundos de la hora concreta de la fecha a consultar (la parte del *time*, vaya). Con el cálculo de la primera parte, evitamos el error del DATEDIFF con los segundos, y en la segunda parte podemos hacer uso sin miedo del DATEDIFF porque como mucho nos devolverá el número de segundos que tiene un día (menos uno).

Es decir, esta parte:

```
DATEDIFF(SECOND, DATEADD(DAY, 0, DATEDIFF(DAY, 0, @inputDate)), @inputDate)
```

Lo único que hace es calcular los segundos de la fecha dada desde el segundo 00:00:00 hasta el de la hora de esa fecha. 19:52:33, por ejemplo. En este caso sería 19 x 60 x 60 + 52 x 60 + 33 = 71.553 segundos.
