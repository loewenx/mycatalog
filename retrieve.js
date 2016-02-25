var Client = require('cloudfoundry-client');
var fs = require('fs');
var async = require('async');
var request = require('request');

var client = new Client({
  host: 'api.ng.bluemix.net',
  protocol: 'https:',
  token: process.argv[2]
    //  ,        // optional if email/password is provided
    //    email: 'my email'    // optional if token is provided
    //    password: 'password' // optional if token is provided
});

try { fs.mkdirSync('public'); } catch (err) { console.log(err); }
try { fs.mkdirSync('public/data'); } catch (err) { console.log(err); }
try { fs.mkdirSync('public/data/icons'); } catch (err) { console.log(err); }

client.buildpacks.get(function (err, buildpacks) {
  if (err) {
    console.log(err);
  } else {
    console.log("Found ", buildpacks.length, "buildpacks");
    var stream = fs.createWriteStream("public/data/buildpacks.json");
    stream.once('open', function (fd) {
      stream.write(JSON.stringify(buildpacks, null, 2));
    });
  }
});

client.services.get(function (err, services) {
  if (err) {
    console.log(err);
  } else {
    console.log("Found ", services.length, "services");
    
    services.forEach(function(service) {
      if (service.entity.extra) {
        service.entity.extra = JSON.parse(service.entity.extra);
      }
    });
    
    var stream = fs.createWriteStream("public/data/services.json");
    stream.once('open', function (fd) {
      stream.write(JSON.stringify(services, null, 2));
    });

    getImages(services);
  }
});

client.servicePlans.get(function (err, servicePlans) {
  if (err) {
    console.log(err);
  } else {
    console.log("Found ", servicePlans.length, "service plans");
    var stream = fs.createWriteStream("public/data/plans.json");
    stream.once('open', function (fd) {
      stream.write(JSON.stringify(servicePlans, null, 2));
    });
  }
});

function getImages(services) {
  var tasks = []
  services.forEach(function (service) {
    tasks.push(function (callback) {
      //  /*
      //  "extra":
      //  "{\"locationDisplayName\":\"US South\",\"providerDisplayName\":\"Business Rules\",
      //  \"longDescription\":\"Enables developers to spend less time recoding and testing when the business policy changes. The Business Rules service minimizes your code changes by keeping business logic separate from application logic.\",
      //  \"displayName\":\"Business Rules\",
      //  \"imageUrl\":\"https://BusinessRulesServiceBroker.ng.bluemix.net/images/ODM-Cloud-OE-64.png\",
      //  \"smallImageUrl\":\"https://BusinessRulesServiceBroker.ng.bluemix.net/images/ODM-Cloud-OE-24.png\",
      //  \"mediumImageUrl\":\"https://BusinessRulesServiceBroker.ng.bluemix.net/images/ODM-Cloud-OE-32.png\",
      //  \"featuredImageUrl\":\"https://BusinessRulesServiceBroker.ng.bluemix.net/images/ODM-Cloud-OE-50.png\",
      //  \"instructionsUrl\":\"http://instructionsUrl\",\"documentationUrl\":
      //  \"https://www.ng.bluemix.net/docs/#services/rules/index.html#rules\",
      //  \"termsUrl\":\"https://www.ibm.com/software/sla/sladb.nsf/sla/bm-6678-01\",\"i18n\":{\"zh-Hant\":{\"description\":\"當商業原則變更時，可以讓開發人員花費較少的時間來記錄和測試。藉由將商業邏輯與應用程式邏輯分開，Business Rules 服務可讓您的程式碼變更減至最少。\",\"metadata\":{\"longDescription\":\"當商業原則變更時，可以讓開發人員花費較少的時間來記錄和測試。藉由將商業邏輯與應用程式邏輯分開，Business Rules 服務可讓您的程式碼變更減至最少。\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"API 呼叫是由規則執行引擎所呼叫，用以取得決策。\",\"free\":false,\"metadata\":{\"plan\":\"標準\",\"bullets\":[\"每月免費 1,000 次 API 呼叫\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1,000 次 API 呼叫\"}],\"displayName\":\"標準\"}}]},\"de\":{\"description\":\"Ermöglicht es Entwicklern, weniger Zeit für Änderungen am Programmcode und Testvorgänge aufzuwenden, wenn sich die Geschäftsrichtlinie ändert. Der Business Rules-Service minimiert Ihre Codeänderungen und hält Geschäftslogik und Anwendungslogik getrennt.\",\"metadata\":{\"longDescription\":\"Ermöglicht es Entwicklern, weniger Zeit für Änderungen am Programmcode und Testvorgänge aufzuwenden, wenn sich die Geschäftsrichtlinie ändert. Der Business Rules-Service minimiert Ihre Codeänderungen und hält Geschäftslogik und Anwendungslogik getrennt.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"Bei API-Aufrufen handelt es sich um Aufrufe, die von der Engine zur Regelausführung ausgehen, um eine Entscheidung zu erhalten.\",\"free\":false,\"metadata\":{\"plan\":\"Standard\",\"bullets\":[\"1.000 API-Aufrufe pro Monat frei\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1.000 API-Aufrufe\"}],\"displayName\":\"Standard\"}}]},\"zh-Hans\":{\"description\":\"使开发人员能够在业务策略发生更改时花费更少的时间来进行重新编码和测试。Business Rules 服务通过保持业务逻辑与应用逻辑的分离来最小化代码更改。\",\"metadata\":{\"longDescription\":\"使开发人员能够在业务策略发生更改时花费更少的时间来进行重新编码和测试。Business Rules 服务通过保持业务逻辑与应用逻辑的分离来最小化代码更改。\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"API 调用是规则执行引擎所进行的用于获取决策的调用。\",\"free\":false,\"metadata\":{\"plan\":\"标准\",\"bullets\":[\"每月 1000 次免费 API 调用\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1000 次 API 调用\"}],\"displayName\":\"标准\"}}]},\"it\":{\"description\":\"Consente agli sviluppatori di impiegare meno tempo nella ricodifica ed esecuzione dei test quando la politica di business viene modificata. Il servizio Business Rules riduce al minimo le modifiche del codice, mantenendo separata la logica di business dalla logica dell'applicazione.\",\"metadata\":{\"longDescription\":\"Consente agli sviluppatori di impiegare meno tempo nella ricodifica ed esecuzione dei test quando la politica di business viene modificata. Il servizio Business Rules riduce al minimo le modifiche del codice, mantenendo separata la logica di business dalla logica dell'applicazione.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"Le chiamate API sono chiamate effettuate dal motore di esecuzione delle regole per ottenere una decisione.\",\"free\":false,\"metadata\":{\"plan\":\"Standard\",\"bullets\":[\"1.000 chiamate API gratuite al mese\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1.000 chiamate API\"}],\"displayName\":\"Standard\"}}]},\"pt-BR\":{\"description\":\"Permite que os desenvolvedores gastem menos tempo registrando e testando quando a política de negócios é alterada. O serviço de Regras de negócios minimiza suas mudanças de código, mantendo a lógica de negócios separada da lógica de aplicativo.\",\"metadata\":{\"longDescription\":\"Permite que os desenvolvedores gastem menos tempo registrando e testando quando a política de negócios é alterada. O serviço de Regras de negócios minimiza suas mudanças de código, mantendo a lógica de negócios separada da lógica de aplicativo.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"As chamadas API são chamadas feitas pelo mecanismo de execução de regra para obter uma decisão.\",\"free\":false,\"metadata\":{\"plan\":\"Padrão\",\"bullets\":[\"1.000 chamadas API grátis por mês\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1.000 chamadas API\"}],\"displayName\":\"Padrão\"}}]},\"ko\":{\"description\":\"비즈니스 정책이 변경될 때 개발자가 레코딩 및 테스트에 사용하는 시간을 줄여줍니다. 비즈니스 규칙 서비스는 비즈니스 로직을 애플리케이션 로직과 분리함으로써 코드 변경사항을 최소화합니다.\",\"metadata\":{\"longDescription\":\"비즈니스 정책이 변경될 때 개발자가 레코딩 및 테스트에 사용하는 시간을 줄여줍니다. 비즈니스 규칙 서비스는 비즈니스 로직을 애플리케이션 로직과 분리함으로써 코드 변경사항을 최소화합니다.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"API 호출은 의사결정을 가져오기 위해 규칙 실행 엔진에서 작성하는 호출입니다.\",\"free\":false,\"metadata\":{\"plan\":\"표준\",\"bullets\":[\"월별 1,000개 API 호출 무료\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1,000개 API 호출\"}],\"displayName\":\"표준\"}}]},\"fr\":{\"description\":\"Permet aux développeurs de consacrer moins de temps au codage et au test lorsque la règle métier change. Le service Business Rules limite les modifications apportées au code en séparant la logique métier de la logique applicative.\",\"metadata\":{\"longDescription\":\"Permet aux développeurs de consacrer moins de temps au codage et au test lorsque la règle métier change. Le service Business Rules limite les modifications apportées au code en séparant la logique métier de la logique applicative.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"Les appels d'API sont des appels effectués par le moteur d'exécution de règle pour obtenir une décision.\",\"free\":false,\"metadata\":{\"plan\":\"Standard\",\"bullets\":[\"1000 appels d'API gratuits par mois\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1000 appels d'API\"}],\"displayName\":\"Standard\"}}]},\"en\":{\"description\":\"Enables developers to spend less time recoding and testing when the business policy changes. The Business Rules service minimizes your code changes by keeping business logic separate from application logic.\",\"metadata\":{\"longDescription\":\"Enables developers to spend less time recoding and testing when the business policy changes. The Business Rules service minimizes your code changes by keeping business logic separate from application logic.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"API calls are calls made by the rule execution engine to get a decision.\",\"free\":false,\"metadata\":{\"plan\":\"Standard\",\"bullets\":[\"1,000 API calls free per month\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1,000 API calls\"}],\"displayName\":\"Standard\"}}]},\"es\":{\"description\":\"Permite a los desarrolladores dedicar menos tiempo a grabar y hacer pruebas si cambia la política empresarial. El servicio Reglas empresariales minimiza los cambios de código manteniendo la lógica empresarial separada de la lógica de aplicaciones.\",\"metadata\":{\"longDescription\":\"Permite a los desarrolladores dedicar menos tiempo a grabar y hacer pruebas si cambia la política empresarial. El servicio Reglas empresariales minimiza los cambios de código manteniendo la lógica empresarial separada de la lógica de aplicaciones.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"Las llamadas a la API las realiza el motor de ejecución de reglas para obtener una decisión.\",\"free\":false,\"metadata\":{\"plan\":\"Estándar\",\"bullets\":[\"1.000 llamadas a la API gratis al mes\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1.000 llamadas a la API\"}],\"displayName\":\"Estándar\"}}]},\"ja\":{\"description\":\"ビジネス・ポリシーが変更されたときに開発者が再コーディングとテストのために費やす時間を短縮できます。 Business Rules サービスは、ビジネス・ロジックとアプリケーション・ロジックを分離しておくことで、お客様が行うコード変更を最小限に抑えることができます。\",\"metadata\":{\"longDescription\":\"ビジネス・ポリシーが変更されたときに開発者が再コーディングとテストのために費やす時間を短縮できます。 Business Rules サービスは、ビジネス・ロジックとアプリケーション・ロジックを分離しておくことで、お客様が行うコード変更を最小限に抑えるこ���ができます。\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"API 呼び出しは、ルール実行エンジンが決定を下すために行う呼び出しです。\",\"free\":false,\"metadata\":{\"plan\":\"標準\",\"bullets\":[\"1 カ月に 1,000 回の API 呼び出し無料\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1,000 回の API 呼び出し\"}],\"displayName\":\"標準\"}}]}},\"plansOrder\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\"}",
      //  */
      //
      var extra = service.entity.extra;
      if (extra && extra.imageUrl) {
        request({
          url: extra.imageUrl,
          encoding: null
        }, function (err, res, body) {
          if (err) {
            callback(err);
          } else {
            fs.writeFile("public/data/icons/" + service.metadata.guid + ".png", body, function (err) {
              if (err) {
                callback(err);
              } else {
                callback(null);
              }
            });
          }
        });
      }
    });
  });

  async.parallel(tasks, function (err, result) {
    if (err) {
      console.log(err);
    }
  });
}
