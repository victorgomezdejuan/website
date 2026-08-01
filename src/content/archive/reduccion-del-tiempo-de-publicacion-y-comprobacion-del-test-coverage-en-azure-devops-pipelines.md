---
title: 'Reducción del tiempo de publicación y comprobación del test coverage en Azure DevOps pipelines'
description: 'Cómo reducir del tiempo de publicación y comprobación de la cobertura de código en Azure DevOps pipelines'
pubDate: 'Oct 19 2024'
---
### Cobertura de código y CI/CD

**No soy especialmente un fan de la cobertura de código tradicional** (líneas de código ejecutadas por los tests) y sí lo soy más de técnicas como [Test Driven Development](https://en.wikipedia.org/wiki/Test-driven_development) (TDD) y [Mutation Testing](https://en.wikipedia.org/wiki/Mutation_testing). No obstante, el code coverage es una condición necesaria aunque no suficiente y **tampoco me molesta si no estorba la consecución de otros objetivos a priori más importantes**.

Estos objetivos pueden ser, por ejemplo, que nuestro código pase todos los tests unitarios y de integración y sea mergeado en la rama principal. Es decir, si la comprobación y publicación de nuestra cobertura de código tarda mucho tiempo, puede llegar a hacer más mal que bien. Cuando creamos tests de baja calidad, por ejemplo, curre algo parecido, ya que al final implican mucho tiempo de mantenimiento y terminamos más preocupados de que pasen como sea que de asegurarnos de que nuestra aplicación funciona correctamente. Es decir, **el code coverage es una herramienta y hay que asegurarse de que actúa en nuestro beneficio.**

En un proyecto en el que estaba trabajando, los tests unitarios se ejecutaban en menos de un minuto mientras que las tareas de comprobación del mínimo porcentaje de cobertura y la publicación del report de la cobertura de código tardaban casi 2 minutos. Este es un claro ejemplo de que, si queremos mantener ese "check", urge encontrar una manera de que no sea la parte de la pipeline de CI/CD que más tarda.

¿Por qué? Pues porque **el tiempo de ejecución de la pipeline de CI afecta en gran medida a la forma de trabajar de un equipo de desarrollo de software y su productividad**. A este respecto recomiendo lecturas como [Continuous Delivery,](https://martinfowler.com/books/continuousDelivery.html) [Accelerate](https://www.amazon.com/Accelerate-Software-Performing-Technology-Organizations/dp/1942788339) y [Modern Software Engineering](https://www.davefarley.net/?p=352).

### Reducción del tiempo de comprobación y publicación de la cobertura de código

Si, como yo, estás convencido de que reducir el tiempo que llevan estas tareas de comprobar y publicar un informe cobertura de código es ampliamente beneficioso para la productividad y el bienestar de tu equipo, te invito a que veas **cómo logré pasar de unos 2 minutos a los menos de 4 segundos actuales** para realizar estas tareas. Como comento en el título del post, **nosotros estábamos utilizando Azure DevOps como plataforma para nuestra pipeline de CI/CD**, por lo que es muy posible que este post te ayude únicamente si tú también utilizas esta plataforma.

La verdad es que la explicación es muy sencilla. Al principio las tareas de comprobación del porcentaje de cobertura de código (para asegurarnos de no bajaba de un umbral) y la publicación de un informe detallado eran las siguientes:

```
  - task: reportgenerator@5
    displayName: "Generate Reports"
    inputs:
      reports: '$(Build.SourcesDirectory)***.Cobertura.xml'
      targetdir: '$(Build.SourcesDirectory)coverletreports'
      reporttypes: 'HtmlInline_AzurePipelines_Dark;Cobertura'
  - task: JakubRumpca.azure-pipelines-html-report.PublishHtmlReport.PublishHtmlReport@1
    displayName: "Publish Unit Tests Report"
    inputs:
      reportDir: '$(Build.SourcesDirectory)coverletreportsindex.html'
  - task: PublishCodeCoverageResults@2
    displayName: "Publish Code Coverage Report"
    inputs:
      summaryFileLocation: '$(Build.SourcesDirectory)coverletreportsCobertura.xml'
      failIfCoverageEmpty: true  
  - task: BuildQualityChecks@9
    displayName: "Code coverage quality check"
    inputs:
      checkCoverage: true
      coverageFailOption: 'fixed'
      coverageType: 'lines'
      coverageThreshold: '85.5'
```

Cómo podéis comprobar, utilizábamos 4 tareas diferentes para comprobar y reportar la información de cobertura de los tests unitarios. Primero generábamos el fichero HTML para que luego apareciera de forma interactiva en una pestaña de la ejecución de la pipeline. Luego publicábamos dos reports diferentes y finalmente comprobábamos que el porcentaje de cobertura total no hubiera bajado.

La primera decisión a tomar en estos casos suele ser **ver si es posible eliminar alguna de las tareas**. Por ejemplo, ¿necesitábamos tener dos reports diferentes para la misma información? La respuesta era que no... Pero sí 😄. Resulta que sólo utilizábamos uno de los reports para realizar consultas, pero la publicación del otro report, el estándar de Azure DevOps, por llamarlo así, era necesario para poder comprobar el porcentaje de cobertura en esa tarea final. Y... ¿Adivináis qué? La publicación del informe que no consultábamos era el que más tardaba en publicarse con diferencia (más de un minuto).

Así que, para no aburriros con todo el proceso y después de muchos pasos de intento y error, llegamos a las siguientes tareas que, como os he comentado, tardaban menos de 4 segundos en ejecutarse.

```
  - task: reportgenerator@5
    displayName: "Generate code coverage report"
    inputs:
      reports: '$(Agent.TempDirectory)/*/*.cobertura.xml'
      targetdir: '$(Build.SourcesDirectory)code-coverage-report'
      reporttypes: 'HtmlInline_AzurePipelines_Dark;Cobertura'
      riskhotspotassemblyfilters: '-*'
      customSettings: 'minimumCoverageThresholds:lineCoverage=85'
  - task: JakubRumpca.azure-pipelines-html-report.PublishHtmlReport.PublishHtmlReport@1
    displayName: "Publish code coverage report"
    condition: always() 
    inputs:
      reportDir: '$(Build.SourcesDirectory)code-coverage-reportindex.html'
      tabName: 'Code Coverage (Complete)'
```

**Son dos tareas: una que genera el report y comprueba el porcentaje de cobertura y otra que publica el report**. Además se trata del report que estábamos consultando, ya que es mucho más user friendly.

La única diferencia es que la nueva funcionalidad que usamos no nos permite introducir decimales en el valor del threshold de coberura. Un mal menor, desde luego 🙂.

¿Cuál fue al final el truco definitivo? Fue encontrar esa funcionalidad un poco oculta de la tarea reportgenerator@5, que tenía un parámetro customSettings, donde, entre otras cosas, puedes comprobar ese nivel de cobertura de código.

Y eso es todo. Espero que, si te encontrabas en la misma situación que nosotros, te sirva de ayuda este post. ¡A seguir programando!
