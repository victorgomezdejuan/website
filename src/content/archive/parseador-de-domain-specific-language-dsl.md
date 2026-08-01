---
title: 'Parseador de Domain Specific Language (DSL)'
description: 'Con un Domain Specific Language (DSL) y un parseador puedes permitir que personas no técnicas puedan implementar reglas de negocio'
pubDate: 'Oct 18 2023'
---
### Domain Specific Language: ¿Qué es y para qué sirve?

Un Domain Specific Language, comúnmente abreviado como DSL, es un lenguaje con una gramática y sintáxis predefinida que tiene como objetivo servir de puente entre la parte de negocio y la parte técnica de un equipo de desarrollo de software. Los que conozcáis DDD (Domain Driven Design) probablemente ya estéis familiarizados con este término así como el de Ubiquitous Language, que no es lo mismo pero están relacionados.

Siendo sinceros, he podido comprobar a lo largo de estos años que este término se utiliza de manera bastante abierta, tanto para lenguages muy abiertos en cuánto a sus restricciones de gramática y sintáxis que están más cercanos a la forma en la que se comunica la gente de negocio, hasta frameworks de programación que restringen la forma en la que los programadores deben desarrollar usando un DSL ([ejemplo](https://github.com/NRules/NRules/wiki/Fluent-Rules-DSL)).

De cualquier manera, sea de forma más o menos abierta o más o menos técnica, normalmente su cometido es el de establecer una lenguage común o al menos el de acercar la parte técnica a la parte de negocio y viceversa. Y es que, ¿cuántas veces os ha llegado una petición de desarrollo nuevo en el lenguage del usuario y una vez habéis entrado al código habéis visto que la forma en la que está desarrollado, nombres incluido, no tiene nada que ver con los términos con los que se expresa el usuario? Seguramente unas cuántas 😅.

Además, el DSL no se tiene por qué quedar ahí, y si se define de una forma más o menos rígida o concreta, puedes ayudarnos en tareas de automatización y prevención de errores, como vamos a poder ver en los ejemplos de este post.

### Definición de reglas de negocio con un DSL

En un proyecto en el que estuve trabajando hace unos meses, necesitábamos que los expertos de negocio definieran una reglas que tenían forma de [árbol de decisión](https://es.wikipedia.org/wiki/%C3%81rbol_de_decisi%C3%B3n). No es objeto de este post explicar este tipo de estructuras pero, a grosso modo, se refieren a condiciones/preguntas que, en función de su resultado/respuesta, dan lugar a otro tipo de condiciones/preguntas, y así hasta llegar a un resultado final (o nodo hoja, en términos de árboles).

El caso es que el equipo decidió que era preferible que los expertos de negocio pudieran definir y actualizar esas reglas en la aplicación de manera independiente o casi. Es decir, en lugar de definirlas con texto libre (u otro formato un poco más específico tipo Gherkin) en las historias de usuario, y luego los programadores lo "tradujeran" a código, se decidió buscar una manera que automatizara la actualización de esas reglas en la aplicación directamente.

A nivel conceptual, necesitábamos proporcionar una especie de back-office como los que ofrecen los CMS (Content Management System) en el que los usuarios modificaran las reglas libremente. Sin embargo, estábamos desarrolando un MVP (Minimun Viable Product) y no queríamos invertir tiempo en crear una interfaz tan compleja como para gestionar árboles de decisión. Otra opción hubiera sido optar por una herramienta externa como [RulesEngine Editor](https://github.com/alexreich/RulesEngineEditor) o [Camunda](https://camunda.com/), pero tampoco era la idea acoplar el producto tan pronto a un software de terceros.

Lo que decidimos finalmente fue definir un lenguage con una gramática y sintaxis definida y muy simple, que permitiera a los expertos de negocio definir las reglas que tenía que seguir la aplicación. Es decir, que puedieran definit cómo se iba a comportar lo que llamamos "el motor" de la aplicación. La parte más importante de la misma.

El DSL era algo así (de forma muy simplificada):

```
RULES:
ClientType = A AND OrderAmount > 100K
ClientType = B AND OrderAmount > 200K
ACTION:
Discount = 10%
```

Probablemente os estéis preguntando "¿pero que leches es esto?" 😆. En este caso nos hemos inventado un lenguaje parecido a SQL (para el apartado de RULES) y con asignaciones muy parecidas a las de la mayoría de lenguajes de programación (para la parte de ACTION). El caso es que, ¡los expertos de negocio sabían definir las reglas con él!

¡Genial! Primer problema solucionado: tenemos un lenguaje que personas no técnicas saben utilizar y suficiemente rígido y acotado para que una máquina (software) también sepa entenderlo (si lo programamos para ello). ¿Entonces ahora qué? Pues ahora toca crear el software que parsee ese texto y lo convierta en reglas que el propio software pueda ejecutar dentro de la aplicación. Necesitamos... ¡un *parser*!

### Creación del parseador (o parser) con ANTLR

A partir de ahora utilizaré la palabra parser en inglés ya que se me hace más natural, a pesar de que este blog está escrito a propósito en castellano para intentar aportar a la comunidad hispana de desarrolladores de software (y porque me permite expresarme con más riqueza). Contradicciones que tiene uno 🙂.

Crear el parser sería la parte puramente técnica de este enfoque/estrategia. En primer lugar, te diré que no es necesario reinventar la rueda, ya que existen herramientas que te facilitan la tarea de crear tu propio parser. Tras revisar varias de ellas, finalmente implementé una primera solución con **[ANTLR](https://www.antlr.org/)**. ANTLR, es un generador de parsers que está hecho en Java pero existen varias herramientas y librerías para poder hacer uso de ella en nuestros proyectos en .NET. Si estás un poco verde en DSL y parsers, como me pasaba a mí, te tocará invertir cierto tiempo en entender un poco cómo funcionan este tipo de herramientas. No es el objetivo de este post explicar todo eso porque seguramente llevaría más de un artículo y porque no es la solución principal que quiero presentar. No obstante, quiero puntualizar que me parece una solución muy buena y que el parser que finalmente implementé con esta herramienta funcionaba perfectamente y cumplía con los requisitos de nuestro problema.

Si quieres probar esta herramienta, puedes seguir los pasos que se indican en [**este post**](https://tomassetti.me/getting-started-with-antlr-in-csharp/) o [**en éste**](https://medium.com/@konstantin.poklonskiy/how-to-create-your-own-language-with-antlr-in-net-a57beba84ecc), por ejemplo. Como puntos clave, te diría que es importante primero entender la diferencia entre Lexer Rules y Parser Rules, ya que necesitarás definir tu DSL con ellas. Normalmente, para un lenguage mínimamente complejo, deberás rellenar dos ficheros diferentes definiendo cada una de esas reglas. Básicamente, en uno de ellos (lexer) definirás los keywords/tokens y en el otro las reglas gramáticas que aplican sobre esos keywords o "ladrillos" sobre los que vas a construir tu DSL.

Por otro lado, al parecer antes era necesario (o aconsejable) utilizar un plugin de Visual Studio para generar tu parser con ANTLR, pero afortunadamente éste no el caso ya. Sólo necesitas rellenar esos dos ficheros que definen tu DSL, incluir los paquetes nuget necesarios en tu proyecto y configurar cómo quieres que ANTLR genere el código C# correspondiente. Quizás esto es lo que menos me gustaba de esta herramienta: que genera código automáticamente. No es algo que me suela gustar, pero los ejemplos para testear que todo funciona correctamente en los posts a los que hago referencia finalmente me convencieron de que se puede confiar en que ANTLR te actualice ese código cuando tu actualices tu gramática y, al mismo tiempo, tener tests que certiquen que ese código funciona como esperas.

ANTLR genera clases con el patrón Visitor o Listener que te permite crear tus objetos de negocio a partir del texto parseado. Es decir, a partir de las clases autogeneradas por ANTLR, tú tienes que crear unas clases que hereden de ellas para capturar el texto parseado y, en estas clases creadas por ti, construir objetos de negocio que se encargarán de aplicar tus reglas de negocio. Así dicho parece complicado, pero te aseguro que una vez hagas tu primer parser, tendrás una herramienta superpotente para poder aplicar en varios de tus proyectos. Una vez cojes la dinámica, generar proyectos que hagan uso de DSL te resultara muy fácil.

Te recomiendo sobre todo bajarte los repositorios de ambos posts y jugar un poco con la gramática y el generador de código para hacerte la idea de cómo funciona ANTLR.

### Creación de tu propio parser

Siendo sincero, cuando empecé a investigar posibles soluciones para crear el parser ya me pareció bastante complejo todo este mundo incluso haciendo uso de herramientas externas como ANTLR. Mi sorpresa fue que cuando le expliqué a mi manager esta solución, me dijo que él sabía crear parsers desde cero y que podíamos intentarlo para este caso 😱. La segunda sorpresa fue que, aunque a día de hoy no tengo claro si es mejor hacer uso de una herramienta como ANTLR o hacer un parser desde cero, la verdad es que la creación de un parser resultó ser mucho más sencilla de lo esperado, al menos para un caso como el nuestro (o al menos para las primeras versiones de nuestro DSL). No sólo eso, la evolución durante un año del DSL pudo ser absorvida por el "custom parser" de manera bastante notable.

Entonces, ¿qué tuvimos que hacer para crear nuestro propio parser? Básicamente, crear dos tipos de clases: Token y Tokenizer.

Las clases de tipo Token (que heredan de la clase abstracta Token) definen los tipos de token o keywords que componen el DSL.

En nuestro caso, teníamos un fichero Token.cs parecido a éste:

```
public abstract class Token {
    internal abstract bool Match(string text);
    public string GetUpper()
        => ToString()!.ToUpper();
    public string GetLower()
        => ToString()!.ToLower();
    public static implicit operator string(Token t) => t.ToString()!;
}
public abstract class RegularToken : Token {
    internal abstract string Regex { get; }
    private readonly Regex _regexText;
    private string _text = "";
    internal RegularToken()
        => _regexText = new(Regex, RegexOptions.IgnoreCase);
    internal override bool Match(string text) {
        Match m = _regexText.Match(text);
        if (m.Success && m.Index == 0)
            _text = m.Value;
        return m.Success && m.Index == 0;
    }
    public override string ToString()
        => _text;
}
public class ConditionalOperatorToken : RegularToken {
    internal override string Regex => @">=|<=|<|>|=";
}
public class LogicalOperatorToken : RegularToken {
    internal override string Regex => @"(AND|OR)b";
}
public class IdToken : RegularToken {
    internal override string Regex => @"[a-zA-Z][a-zA-Z0-9_-]*";
}
public class NumberToken : RegularToken {
    internal override string Regex => @"[0-9]+(.[0-9]+)?";
}
public class SymbolToken : RegularToken {
    internal override string Regex => @"[():,[]%]";
}
public class NewLineToken : RegularToken {
    internal override string Regex => @"(r)?n";
}
public class EOFToken : Token {
    internal override bool Match(string text)
        => string.IsNullOrWhiteSpace(text);
    public override string ToString()
        => string.Empty;
}
public class SpaceToken : RegularToken {
    internal override string Regex => @"[^Srn]+"; // s: space/new lines, but no new lines
}
```

Como veis, cada clase concreta que hereda de la clase abstracta Token contiene un regex que define el tipo de keyword que representa. Estas clases nos permiten clasificar, acotar e identificar cada token diferente de la gramática y poder obtener su valor en forma de string, lo cuál nos permite, en última instancia, poder identificar y comprobar palabras concretas o valores concretos.

Por tanto, tenemos unas clases que son capaces de recibir un string concreto y decirnos si ese string corresponde a un token concreto (un operador lógico, un ID, un número, etc.), pero necesitamos algo más. Necesitamos otro ente que vaya recorriendo el texto de input que le proporcionemos y vaya proporcionándonos los tokens que se vaya encontrando en orden. Ahí es donde entra el Tokenizer.

```
public class Tokenizer {
    private readonly string _text;
    private int _index;
    private readonly Func<Token>[] _tokens = {
        () => new LogicalOperatorToken(),
        () => new ConditionalOperatorToken(),
        () => new IdToken(),
        () => new NumberToken(),
        () => new SymbolToken(),
        () => new NewLineToken(),
        () => new EOFToken()
    };
    public Tokenizer(string text) {
        _text = text;
        _index = 0;
        Line = 1;
    }
    public int Line { get; internal set; }
    public Token NextToken() {
        string text = _text[_index..];
        SpaceToken space = new();
        if (space.Match(text)) {
            _index += space.ToString().Length;
            text = _text[_index..];
        }
        Token token = _tokens
            .Select(t => t.Invoke())
            .FirstOrDefault(t => t.Match(text)) ?? new EOFToken();
        if (token is NewLineToken) {
            Line++;
        }
        _index += token.ToString()!.Length;
        return token;
    }
    public Token PeekNextToken() {
        int index = _index;
        string text = _text[index..];
        SpaceToken space = new();
        if (space.Match(text)) {
            index += space.ToString().Length;
            text = _text[index..];
        }
        return _tokens
            .Select(t => t.Invoke())
            .FirstOrDefault(t => t.Match(text)) ?? new EOFToken();
    }
}
```

Esta clase es la que nos va a permitir ir recorriendo los diferentes tokens/keywords del texto a parsear e ir construyendo nuestros objetos de negocio a partir de esa información. En concreto, podéis ver que recibe en el constructor el texto a parsear (en formato plano) y que contiene dos métodos públicos para obtener el siguiente token y consumirlo (NextToken) o consultar el siguiente token pero sin consumirlo (PeekNextToken).

Podéis consultar un pequeño proyecto que se encarga de parsear el DSL que ponía al principio del artículo [**aquí**](https://github.com/victorgomezdejuan/parser).

Reconozco que no he sido muy cuidadoso con el diseño 😬. Forgive me!
