---
title: 'Cómo crear un Datawarehouse desde cero'
description: 'En este post explico como crear un Datawarehouse desde cero con tecnologías Microsoft (SQL Server, SSIS y SSAS).'
pubDate: 'Jul 11 2021'
---
#### Introducción

Si nos fijamos en las publicaciones de los últimos años en lo que se refiere a explotación de datos, **los [**Datawarehouse****s**](https://es.wikipedia.org/wiki/Almac%C3%A9n_de_datos) han dejado de ser el elemento más popular**. Es más, ya casi nadie habla de ellos.

La mayoría de contenidos modernos se centran en Data Science (con [**R**](https://es.wikipedia.org/wiki/R_\(lenguaje_de_programaci%C3%B3n\)) y [**Python**](https://es.wikipedia.org/wiki/Python) a la cabeza), Big Data (y las bases de datos NoSQL) y el Dashboarding interactivo (con [**Power BI**](https://powerbi.microsoft.com/es-es/), [**Tableau**](https://www.tableau.com/es-es), [**Qlik Sense**](https://www.qlik.com/es-es/products/qlik-sense) y otras herramientas pegando fuerte).

¿Significa esto que el datawarehousing ha muerto? Ni mucho menos. De hecho, la variedad de fuentes de datos no hace más que crecer y herramientas como [**Talend**](https://www.talend.com/) ya se han desmarcado para especializarse en entornos pujantes como el Cloud o el híbrido. A la hora de obtener, transformar y almacenar los datos de manera entendible y unificada, se hace más urgente que nunca hacerlo de una forma ordenada, automatizada, mantenible y fácilmente transmitible tanto a (nuev@s) compañer@s de equipo, como a responsables, usuari@s y clientes.

**El datawarehousing, como el resto de elementos del mundo de software y los datos, debe modernizarse y adaptarse a los nuevos tiempos, pero no parece que vaya a desaparecer.**

#### ¿Por qué utilizar SSIS y SSAS?

Dicho lo anterior, tampoco nos engañemos. **Herramientas clásicas de [ETL](https://es.wikipedia.org/wiki/Extract,_transform_and_load) y [OLAP](https://es.wikipedia.org/wiki/OLAP) como SSIS y SSAS acabarán por desaparecer** (o casi), como lo han hecho el resto de herramientas similares de Microsoft u otro proveedor. Llega un momento que sale más a cuenta sacar un nuevo producto que seguir evolucionando lo que tienes. Ahora bien, como a cualquier otra tecnología, siempre se le da por muerta mucho antes de que desaparezca completamente.

Entonces, ¿por qué crear un Datawarehouse con estas herramientas? Se me ocurren dos razones, principalmente:

-   **Económicas**. Como ya apunté en [**mi post sobre SSRS**](/archive/reporting-services-la-gran-olvidada/), muchas empresas, y muchas PYMEs en concreto, cuentan con uno o varios servidores SQL Server. Las licencias Standard o Enterprise de este producto te permiten hacer uso de SSIS, SSAS y SSRS sin coste adicional. A pesar del bombardeo incesante con el tema del Cloud, muchas empresas siguen teniendo sus servidores *on premises*. Y no están dispuestas, al menos de momento, a lanzarse a la nube. La económica, sin duda, es una buena razón. Sobre todo cuando no está en tu mano realizar la inversión correspondiente.
-    De **conocimiento previo**. Puede que haya muchas cosas que te vinculen con estas tecnologías de Microsoft. Puede que hayas estado utilizando bases de datos SQL Server durante años, que hayas utilizado SSIS o SSAS por separado, que te manejes con Management Studio o Visual Studio estupendamente, o que hayas heredado algunos Datawarehouses que utilizan estas herramientas pero no hayas hecho uno desde cero. O puede que hayas hecho varios, pero en ese caso no necesitas leer este post, jeje. Otra posibilidad es que seas experto/a en Excel y/o SSRS, herramientas con las que SSIS Y SSAS se integran perfectamente.

Aún así, puede que tengas reticencias a utilizar una tecnología que aparentemente esta abocada a morir. Te daré otras dos razones adicionales, entonces: 

-   **Los conceptos básicos de datawarehousing son los mismos para prácticamente todas las herramientas disponibles. Es muy importante que, si trabajas o vas a trabajar con datos, domines estos conceptos** (ETL, desnormalización, dimesiones, hechos, etc.).
-   Es probable que en un futuro te toque lidiar con Datawarehouses implementados con esta tecnología. No es nada raro que, ya sea como desarrollador/a o como analista de datos, te encuentres con labores de mantenimiento o migración de Datawarehouses ya existentes. Si quieres cambiar esta plataforma a algo más moderno o cool (o pasarla a la nube con [**Azure Analysis Services**](https://azure.microsoft.com/es-es/services/analysis-services/), por ejemplo), seguramente tendrás primero que entender que se está haciendo ahora.
-   Sé que a veces resulta tedioso, y para nada lo considero indispensable, pero tener experiencia en tecnologías que han sido populares te da un background muy útil e incluso atractivo a la hora de encarar nuevos proyectos/tecnologías. El conocimiento no ocupa lugar, que se suele decir.
-   Como he comentado en el primer punto, **un servicio de Azure que está teniendo cierta acogida es Azure Analysis Services, y empezar por crear un Datawarehouse *on premises* para luego continuar tu formación o investigar sobre cómo pasarlo a la nube puede ser muy útil.** Se trata de herramientas muy similares, y no es nada difícil pasar de una a otra.

#### Cómo crear el Datawarehouse

Si finalmente te has decidido a implementar un nuevo Datawarehouse con estas tecnologías, **te quiero compartir recursos valiosos con los que empezar.**

Y es que, aunque me gustaría crear una serie de posts explicando el paso a paso, ahora mismo no dispongo del tiempo necesario. Afortunadamente, en su día invertí bastante tiempo en encontrar artículos útiles para personas que, como yo, estábamos empezando en este mundo pero, al mismo tiempo, necesitábamos una formación muy práctica y directa para implementar un Datawarehouse en real, en una empresa. Con diligencia, sí, pero sin mucha demora.

**El objetivo de un Datawarehouse es centralizar toda la información de la empresa en una única base de datos para ser capaces de hacer consultas que integren diferentes fuentes de datos y momentos históricos y que sean rápidas.** Esto hace que, incluso si toda la información que necesitas está en una única BBDD (normalmente la del ERP) sea interesante crear un Datawarehouse para crear consultas de alto nivel. Es decir, consultas que no requieran entrar en el detalle de los datos, si no en filtros y agregados. Las consultas que tiran de un Datawarehouse normalmente están dirigidas a ofrecer la información que requiere personal de Dirección, responsables de área o empleados/as del departamentos de Administración/Finanzas.

El auge de herramientas de interfaz de usuario que prometen hacer todo el trabajo de ETL y reporting como Power BI lleva a que muchas empresas estén atacando directamente bases de datos transaccionales para sus informes Business Intelligence. Ni que decir tiene que esto no es una buena práctica. La principal desventaja es el impacto en el rendimiento de la base de datos, pero también está la dificultad para much@s usuari@s de obtener datos de estas bases de datos o el impacto que pueden tener los continuos cambios en ellas. El mantenimiento del código necesario para realizar estas operaciones además, se vuelve más complejo y difícil de realizar.

¿Quieres crear un nuevo Datawarehouse en tu empresa? Sigue estos pasos:

##### 1\. Base de datos aparte

El primer paso para crear un Datawarehouse por tanto, es claro: queremos llevar los datos del ERP, CRM, sistema de RRHH, etc., a otra base de datos. A una BBDD que sea sólo de consulta para realizar consultas de agregado y filtrado complejas de forma rápida.

##### 2\. Desnormalización

¡Olvídate de las reglas de las BBDDs relacionales! Sí, lo has leído bien, ólvidate de las reglas de integridad, pues para poder hacer consultas eficientes sobre muchos datos necesitamos crear tablas que repitan los datos de varias columnas e integren datos de diferentes entidades de dominio.

##### 3\. Dimensiones y Hechos

En Internet, vas a ver estos conceptos referidos más comúnmente como *Dimensions* and *Facts*. Estos son los dos pilares sobre los que se asientan los Datawarehouses y sus tablas. Las tablas de un Datawarehouse, por tanto, pueden ser de Hechos o de Dimensiones. Dentro de ellas existen varios subtipos, pero de momento quédate con esta idea (no del todo purista): Las Dimensiones contienen los datos por los cuáles vamos a filtrar y agregar los datos numéricos y los Hechos los datos númericos que van a ser agregados/filtrados (también llamados *medidas*).

Ejemplos de tablas de Dimensiones pueden ser Producto (con los campos Marca, Modelo, Planta Productiva, Año de lanzamiento, etc.), Cliente (con los campos País, Continente, Sector, Tamaño, etc.) y, una que se suele repetir siempre, Tiempo (con los campos Semana del Año, Mes, Trimestre, etc.).

Las tablas de Hechos, en cambio, tendrán nombres como Ventas, Compras, Facturación, Producción... Y básicamente contendrán claves externas a las tablas de Dimensiones y campos numéricos para cada combinación de esas claves. Esto lo comprenderás mejor más adelante, no te preocupes.

Si habéis utilizado tablas dinámicas, estos conceptos, aunque con otros nombres, ya os sonarán. Ya que no utilizáis de la misma forma los campos descriptivos y los númericos. La diferencia creo que se ve más o menos clara.

Para que empecéis a integrar y entender los dos últimos puntos, os recomiendo ver estos vídeos:

https://www.youtube.com/watch?v=sDdoQGSQCEY

https://www.youtube.com/watch?v=WAOs7E0xXZk

Para construir el Datawarehouse es para lo que utilizamos SSIS. Es decir, con SSIS consultamos, transformamos, integramos y volcamos los datos de la forma requerida en el Datawarehouse. SSIS automatiza la actualización del Datawarehouse con las diferentes fuentes de datos de los que se nutre.

##### 4\. Los cubos (OLAP)

Vale, con los dos puntos anteriores podemos empezar a hacernos una idea de cómo se implementa un Datawarehouse pero, ¿Cómo se explota? ¿Cómo se realizan consultas sobre esas tablas de Dimensiones y Hechos? Aquí es donde entra en juego este concepto de OLAP *(*On-Line Analytical Processing*).* OLAP es la solución escogida a la ahora de explotar la informaciçon contenida en un Datawarehouse. Se trata de un tipo de procesamiento de datos específico para explotar grandes cantidades de datos de forma rápida y ágil.

A este respecto, el siguiente paso por tanto será crear un nuevo servidor de SSAS. Para ello Microsoft nos dará dos opciones difentes de configuración: Multidimensional o Tabular. La primera es la clásica y con la que muchos de nosotros/as hemos aprendido esta tecnología. Pero **la más popular y la que suele dar mejores resultados en general es la Tabular.**

En Analisis Services por tanto, el objeto más importante que vamos a crear van a ser los cubos. Los cubos van a ser los elementos a los que nos vamos a conectar desde una herramienta de reporting (Excel, Power BI, etc.) para poder explotar los datos a través de una interfaz gráfica. Así, desde Excel, por ejemplo, si queremos hacer una tabla dinámica sobre una base de datos transaccional, podemos conectarnos a un servidor SQL Server y escoger una tabla, vista o consulta concreta. Con SSAS, lo que haremos en conectarnos a un cubo concreto. Así, si nos conectamos a un cubo de Producción, por ejemplo, podremos filtrar y agregar por columnas como Tipo de Producto o Mes de Fin de Producción, datos como Número de Unidades Producidas u Horas Trabajadas.

Es en este momento en el que quería compartirte el que para mí fue el recurso más preciado que encontré. Se trata de esta [**serie de artículos del blog Bi Cortex**](http://bicortex.com/how-to-build-a-data-mart-using-microsoft-bi-stack-part-1-introduction-and-oltp-database-analysis/) en los que se explica de manera prácticamente inmejorable como crear un Datawarehouse desde cero. Desde que lo descubrí, no he parado de recomendarlo, ya que resultó un recurso vital a la hora de crear mi primer Datawarehouse. Martin, su autor, es un crack y estoy seguro de que no soy el único que le tiene agradecimiento infinito por haberlo publicado.

##### 5\. Explotación de datos

Son múltiples las herramientas que puedes utilizar para explotar los datos de cubos de SSAS, pero yo empezaría sin duda por Excel y Power BI. Por ser las más populares y, seguramente, las más sencillas.

#### Manos a la obra

Para poder abordar este tipo de proyectos, como sabes, no hay nada como ponerse a ello. El famoso *learning by doing*. El mundo del datawarehousing, obviamente, abarca mucho más que esto. Pero para llegar lejos, debemos comenzar por andar cerca ;-).

Mucho ánimo con la tarea y puedes consultarme cualquier duda en la sección de comentarios del post.
