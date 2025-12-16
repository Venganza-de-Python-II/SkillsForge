<!-- Banner animado -->
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=200&section=header&text=SkillsForge&fontSize=80&fontColor=fff&animation=fadeIn&fontAlignY=32&desc=Plataforma%20de%20Talleres%20Profesionales&descAlignY=60&descSize=20" width="100%" />
</p>

<!-- Typing SVG -->
<p align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=600&size=22&pause=1000&color=667EEA&center=true&vCenter=true&random=false&width=600&lines=Gesti%C3%B3n+de+Talleres+Profesionales;100%25+Serverless+en+AWS;Next.js+15+%2B+React+19;IA+con+Amazon+Bedrock+Nova" alt="Typing SVG" />
  </a>
</p>

<!-- Badges principales -->
<p align="center">
  <img src="https://img.shields.io/badge/AWS-CDK-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white" alt="AWS CDK" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Serverless-FD5750?style=for-the-badge&logo=serverless&logoColor=white" alt="Serverless" />
</p>

<p align="center">
  <a href="#-demo">Demo</a> •
  <a href="#-por-qué-vercel">Por qué Vercel</a> •
  <a href="#-api">API</a> •
  <a href="#-flujos-internos">Flujos</a> •
  <a href="#-requisitos-cumplidos">Requisitos</a>
</p>

<br/>

## 🌐 Demo

<table>
<tr>
<td>

### 🖥️ Frontend (Vercel)
[![Vercel](https://img.shields.io/badge/Ver_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://skills-forge-main.vercel.app)

`skills-forge-main.vercel.app`

</td>
<td>

### 🚪 API (AWS)
[![AWS](https://img.shields.io/badge/API_Gateway-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://qt6hwpaad0.execute-api.us-east-1.amazonaws.com/dev/)

`qt6hwpaad0.execute-api.us-east-1.amazonaws.com/dev`

</td>
</tr>
</table>

> [!NOTE]
> El frontend usa Vercel mientras que el backend está 100% en AWS. Ver [Por qué Vercel](#-por-qué-vercel) para más detalles.

<br/>

## ⚡ Stack Tecnológico

<table>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=nextjs" width="48" height="48" alt="Next.js" />
<br><b>Next.js 15</b>
<br><sub>App Router</sub>
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
<br><b>React 19</b>
<br><sub>Server Components</sub>
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
<br><b>Tailwind</b>
<br><sub>+ shadcn/ui</sub>
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=typescript" width="48" height="48" alt="TypeScript" />
<br><b>TypeScript</b>
<br><sub>Strict mode</sub>
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=vercel" width="48" height="48" alt="Vercel" />
<br><b>Vercel</b>
<br><sub>Edge Network</sub>
</td>
</tr>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=python" width="48" height="48" alt="Python" />
<br><b>Python 3.11</b>
<br><sub>Lambda Runtime</sub>
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=aws" width="48" height="48" alt="AWS" />
<br><b>AWS CDK</b>
<br><sub>IaC</sub>
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=dynamodb" width="48" height="48" alt="DynamoDB" />
<br><b>DynamoDB</b>
<br><sub>Single-Table</sub>
</td>
<td align="center" width="96">
<img src="https://img.icons8.com/color/48/amazon-web-services.png" width="48" height="48" alt="Cognito" />
<br><b>Cognito</b>
<br><sub>Auth + JWT</sub>
</td>
<td align="center" width="96">
<img src="https://img.icons8.com/fluency/48/artificial-intelligence.png" width="48" height="48" alt="Bedrock" />
<br><b>Bedrock</b>
<br><sub>Nova Micro</sub>
</td>
</tr>
</table>

<br/>

## 🏗️ Arquitectura

<details open>
<summary><b>🔍 Ver diagrama de arquitectura completo</b></summary>
<br/>

```mermaid
flowchart TB
    subgraph Internet
        U["👤 Usuario"]
    end

    subgraph Vercel ["☁️ Vercel (Frontend)"]
        V_EDGE["🌐 Edge Network"]
        V_SSR["⚡ Next.js SSR"]
        V_STATIC["📄 Static Assets"]
    end

    subgraph AWS ["☁️ AWS (Backend)"]
        subgraph Security ["🛡️ Security Layer"]
            WAF["WAF v2"]
        end
        
        subgraph Compute ["⚡ Compute"]
            APIGW["API Gateway"]
            Lambda["Lambda x16"]
        end
        
        subgraph Data ["🗄️ Data Layer"]
            DDB[("DynamoDB")]
            Cognito["Cognito"]
        end
        
        subgraph AI ["🤖 AI"]
            Bedrock["Bedrock Nova"]
        end
        
        subgraph Events ["📨 Events"]
            EB["EventBridge"]
            SNS["SNS"]
            SQS["SQS DLQ"]
        end
        
        subgraph Monitoring ["📊 Observability"]
            CW["CloudWatch"]
            XRAY["X-Ray"]
        end
    end

    U --> V_EDGE
    V_EDGE --> V_SSR
    V_EDGE --> V_STATIC
    V_SSR --> WAF
    WAF --> APIGW
    APIGW --> Lambda
    Lambda --> DDB
    Lambda --> Cognito
    Lambda --> Bedrock
    Lambda --> EB
    EB --> SNS
    EB --> SQS
    Lambda -.-> CW
    Lambda -.-> XRAY
```

</details>

<br/>

## 🚀 Por qué Vercel (y no S3)

> [!IMPORTANT]
> **S3 no puede ejecutar Next.js 15.** Punto. S3 solo guarda y sirve archivos estáticos (HTML, CSS, JS, imágenes). Pero Next.js 15 con App Router necesita ejecutar código en el servidor para funcionar.

### El problema

Nuestro frontend usa cosas que necesitan un servidor corriendo:

- **Server Components** - React se ejecuta en el servidor, no en el navegador
- **Server Actions** - Funciones que corren en el servidor desde un botón
- **Rutas dinámicas** - Páginas que se generan al momento de la petición
- **Middleware** - Código que corre antes de cada request

S3 es un bucket de archivos. No ejecuta código. Es como querer correr un programa de Python en una carpeta de Google Drive - simplemente no funciona.

### La solución

Vercel es de los mismos que crearon Next.js, así que lo soportan al 100%:

| Qué necesitamos | S3 | Vercel |
|-----------------|:--:|:------:|
| Server Components | ❌ | ✅ |
| Server Actions | ❌ | ✅ |
| Páginas dinámicas | ❌ | ✅ |
| Middleware | ❌ | ✅ |

<details>
<summary><b>¿Y si quiero quedarme en AWS?</b></summary>

Hay opciones, pero son más complicadas:

- **AWS Amplify** - Funciona pero tiene sus limitaciones con Next.js 15
- **Lambda@Edge + S3** - Posible pero un dolor de cabeza configurarlo
- **ECS/Fargate** - Muy overkill para esto, y ya no es serverless de verdad

Vercel hace todo esto automático con un `git push`.

</details>

<br/>

## 📊 Recursos AWS Desplegados

<details open>
<summary><b>Ver recursos en producción</b></summary>

| Servicio | Recurso | Detalles |
|:--------:|---------|----------|
| ![API](https://img.shields.io/badge/-API_Gateway-FF9900?style=flat-square&logo=amazon-aws) | `qt6hwpaad0` | REST API + WAF |
| ![DynamoDB](https://img.shields.io/badge/-DynamoDB-4053D6?style=flat-square&logo=amazon-dynamodb) | `SkillsForge-Dev-Workshops` | 37 items, 3 GSIs |
| ![Cognito](https://img.shields.io/badge/-Cognito-DD344C?style=flat-square&logo=amazon-aws) | `us-east-1_pcERcMaid` | 7 usuarios |
| ![Lambda](https://img.shields.io/badge/-Lambda-FF9900?style=flat-square&logo=aws-lambda) | 16 funciones | Python 3.11 |
| ![EventBridge](https://img.shields.io/badge/-EventBridge-FF4F8B?style=flat-square&logo=amazon-aws) | `SkillsForge-Dev-EventBus` | Event-driven |
| ![SNS](https://img.shields.io/badge/-SNS-FF4F8B?style=flat-square&logo=amazon-aws) | `SkillsForge-Dev-Notifications` | Email alerts |

</details>

<br/>

## 🗄️ Modelo de Datos

> [!TIP]
> Usamos **Single-Table Design** para minimizar costos y maximizar rendimiento.

<details>
<summary><b>📊 Ver diagrama ER de entidades</b></summary>
<br/>

```mermaid
erDiagram
    WORKSHOPS ||--o{ REGISTRATIONS : tiene
    USERS ||--o{ REGISTRATIONS : hace
    
    WORKSHOPS {
        string PK
        string SK
        string nombre
        string descripcion
        int cupo_maximo
        int inscritos
        date fecha
        string categoria
    }
    
    USERS {
        string PK
        string SK
        string nombre
        string role
        date created_at
    }
    
    REGISTRATIONS {
        string PK
        string SK
        string workshop_nombre
        date fecha_registro
    }
```

</details>

### 📐 Estructura de Claves

| Entidad | PK | SK |
|---------|----|----|  
| 🎓 Taller | `WORKSHOP#{uuid}` | `META` |
| 👤 Usuario | `USER#{email}` | `META` |
| 📝 Inscripción | `USER#{email}` | `REGISTRATION#{workshop_id}` |

<details>
<summary><b>🔍 Ver diagrama de GSIs</b></summary>
<br/>

```mermaid
flowchart LR
    subgraph GSI1 ["GSI1: Por Fecha"]
        G1_PK["PK: WORKSHOP#ALL"]
        G1_SK["SK: fecha"]
    end
    
    subgraph GSI2 ["GSI2: Por Categoría"]
        G2_PK["PK: CATEGORY#nombre"]
        G2_SK["SK: fecha"]
    end
    
    subgraph GSI3 ["GSI3: Inscripciones"]
        G3_PK["PK: WORKSHOP#id"]
        G3_SK["SK: fecha_registro"]
    end
    
    GSI1 --> |"Listar todos"| Q1["GET /workshops"]
    GSI2 --> |"Filtrar"| Q2["GET /workshops?category=X"]
    GSI3 --> |"Inscritos"| Q3["GET /workshops/{id}/students"]
```

</details>

| GSI | Partition Key | Sort Key | Uso |
|-----|---------------|----------|-----|
| GSI1 | `WORKSHOP#ALL` | `fecha` | Listar todos por fecha |
| GSI2 | `CATEGORY#{nombre}` | `fecha` | Filtrar por categoría |
| GSI3 | `WORKSHOP#{id}` | `fecha_registro` | Listar inscritos |

<details>
<summary><b>📝 Ejemplo de Items en DynamoDB</b></summary>

```json
// 🎓 Taller
{
  "PK": "WORKSHOP#abc-123",
  "SK": "META",
  "GSI1PK": "WORKSHOP#ALL",
  "GSI1SK": "2024-02-15",
  "GSI2PK": "CATEGORY#desarrollo",
  "nombre": "Docker para Developers",
  "descripcion": "Aprende contenedores desde cero",
  "cupo_maximo": 30,
  "inscritos": 12,
  "fecha": "2024-02-15T10:00:00Z"
}

// 👤 Usuario
{
  "PK": "USER#juan@email.com",
  "SK": "META",
  "nombre": "Juan Pérez",
  "role": "student",
  "created_at": "2024-01-10T08:30:00Z"
}

// 📝 Inscripción
{
  "PK": "USER#juan@email.com",
  "SK": "REGISTRATION#abc-123",
  "GSI3PK": "WORKSHOP#abc-123",
  "GSI3SK": "2024-01-20T14:00:00Z",
  "workshop_nombre": "Docker para Developers",
  "workshop_fecha": "2024-02-15T10:00:00Z"
}
```

</details>

<br/>

## 🔗 API REST

> Base URL: `https://qt6hwpaad0.execute-api.us-east-1.amazonaws.com/dev`

### Endpoints Públicos

| Método | Endpoint | Descripción |
|:------:|----------|-------------|
| ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | `/workshops` | Listar talleres |
| ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | `/workshops/{id}` | Detalle de taller |
| ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | `/workshops/categories` | Categorías |
| ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | `/stats` | Estadísticas |
| ![POST](https://img.shields.io/badge/POST-49CC90?style=flat-square) | `/auth/login` | Iniciar sesión |
| ![POST](https://img.shields.io/badge/POST-49CC90?style=flat-square) | `/auth/register` | Registrarse |

### Endpoints Protegidos (JWT)

| Método | Endpoint | Role | Descripción |
|:------:|----------|:----:|-------------|
| ![POST](https://img.shields.io/badge/POST-49CC90?style=flat-square) | `/workshops/{id}/register` | 🎓 | Inscribirse |
| ![DELETE](https://img.shields.io/badge/DELETE-F93E3E?style=flat-square) | `/workshops/{id}/register` | 🎓 | Cancelar inscripción |
| ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | `/registrations/mine` | 🎓 | Mis inscripciones |
| ![POST](https://img.shields.io/badge/POST-49CC90?style=flat-square) | `/ai/assistant` | 🎓 | Chat con IA |
| ![POST](https://img.shields.io/badge/POST-49CC90?style=flat-square) | `/workshops` | 👑 | Crear taller |
| ![PUT](https://img.shields.io/badge/PUT-FCA130?style=flat-square) | `/workshops/{id}` | 👑 | Editar taller |
| ![DELETE](https://img.shields.io/badge/DELETE-F93E3E?style=flat-square) | `/workshops/{id}` | 👑 | Eliminar taller |

> 🎓 = Student &nbsp;&nbsp; 👑 = Admin

<details>
<summary><b>📝 Ejemplos de Request/Response</b></summary>

**Login:**
```bash
curl -X POST https://qt6hwpaad0.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@mail.com", "password": "MiPassword123!"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "user": {
    "email": "usuario@mail.com",
    "role": "student",
    "nombre": "Usuario Demo"
  }
}
```

---

**Inscribirse a taller:**
```bash
curl -X POST .../workshops/abc-123/register \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "message": "Inscripción exitosa",
  "workshop": "Docker para Developers",
  "fecha": "2024-02-15T10:00:00Z"
}
```

</details>

<br/>

## 🔄 Flujos Internos

<details>
<summary><b>🔐 Flujo de Autenticación</b></summary>
<br/>

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Usuario
    participant V as ☁️ Vercel
    participant WAF as 🛡️ WAF
    participant API as 🚪 API Gateway
    participant L as ⚡ Lambda
    participant C as 🔐 Cognito

    U->>V: Email + Password
    V->>WAF: POST /auth/login
    WAF->>WAF: Validar rate-limit
    WAF->>API: Forward request
    API->>L: Invoke auth/login
    L->>C: AdminInitiateAuth
    C->>C: Validar credenciales
    C-->>L: JWT Tokens
    L-->>API: {token, user}
    API-->>V: 200 OK
    V->>V: localStorage.setItem('token')
    V-->>U: Redirect /dashboard
```

</details>

<details>
<summary><b>📝 Flujo de Inscripción a Taller</b></summary>
<br/>

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Usuario
    participant API as 🚪 API Gateway
    participant Auth as 🔐 JWT Authorizer
    participant L as ⚡ Lambda
    participant DB as 🗄️ DynamoDB
    participant EB as 📨 EventBridge
    participant SNS as 📧 SNS

    U->>API: POST /workshops/{id}/register
    API->>Auth: Validar JWT
    Auth-->>API: ✅ Token válido
    API->>L: Invoke
    
    L->>DB: GetItem (workshop)
    DB-->>L: Workshop data
    
    alt ✅ Hay cupos disponibles
        L->>DB: TransactWriteItems
        Note over DB: 1. Crear registro<br/>2. Incrementar inscritos
        DB-->>L: Success
        L->>EB: PutEvent (STUDENT_REGISTERED)
        EB->>SNS: Trigger notification
        SNS-->>U: 📧 Email confirmación
        L-->>U: 201 Created
    else ❌ Sin cupos
        L-->>U: 409 Conflict
    end
```

</details>

<details>
<summary><b>🤖 Flujo del Asistente IA (Bedrock)</b></summary>
<br/>

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Usuario
    participant L as ⚡ Lambda
    participant DB as 🗄️ DynamoDB
    participant B as 🤖 Bedrock

    U->>L: POST /ai/assistant
    Note right of U: {message: "¿Qué talleres hay de Python?"}
    
    L->>DB: Query workshops
    DB-->>L: Lista de talleres
    
    L->>L: Construir contexto
    Note over L: System prompt +<br/>datos de talleres +<br/>pregunta usuario
    
    L->>B: InvokeModel (Nova Micro)
    B->>B: Procesar con contexto
    B-->>L: Respuesta generada
    
    L-->>U: {response: "Tenemos 3 talleres..."}
```

</details>

<details>
<summary><b>📊 Sistema de Eventos (EventBridge)</b></summary>
<br/>

```mermaid
flowchart TB
    subgraph Triggers ["🎯 Eventos"]
        E1["STUDENT_REGISTERED"]
        E2["WORKSHOP_CREATED"]
        E3["WORKSHOP_UPDATED"]
        E4["REMINDER_24H"]
    end
    
    subgraph EventBridge ["📨 EventBridge"]
        EB["Event Bus"]
        R1["Rule: Notifications"]
        R2["Rule: Reminders"]
    end
    
    subgraph Targets ["🎯 Targets"]
        SNS["📧 SNS"]
        L["⚡ Lambda Processor"]
        DLQ["🗑️ SQS DLQ"]
    end
    
    E1 & E2 & E3 --> EB
    E4 --> EB
    EB --> R1 --> SNS
    EB --> R2 --> L
    L -.->|On Error| DLQ
```

</details>

<details>
<summary><b>⏰ Recordatorios Automáticos</b></summary>
<br/>

```mermaid
flowchart LR
    subgraph Scheduler ["📅 EventBridge Scheduler"]
        CRON["⏰ Cada hora"]
    end
    
    subgraph Process ["⚡ Lambda"]
        CHECK["Buscar talleres próximos"]
        FILTER["Filtrar 24h antes"]
        SEND["Enviar recordatorios"]
    end
    
    subgraph Notify ["📨 Notificaciones"]
        SNS["SNS Topic"]
        EMAIL["📧 Email"]
    end
    
    CRON --> CHECK --> FILTER --> SEND --> SNS --> EMAIL
```

</details>

<br/>

## ✅ Requisitos Cumplidos

<table>
<tr>
<td width="50%" valign="top">

### 🧱 Arquitectura Cloud
| Requisito | Estado |
|-----------|:------:|
| Frontend en Vercel (SSR) | ✅ |
| API Gateway REST | ✅ |
| Lambda (Python 3.11) | ✅ |
| DynamoDB Single-Table | ✅ |
| Amazon Cognito (JWT) | ✅ |
| EventBridge + SNS | ✅ |
| SQS Dead Letter Queue | ✅ |
| EventBridge Scheduler | ✅ |
| Amazon Bedrock (IA) | ✅ |

### 🗄️ Base de Datos
| Requisito | Estado |
|-----------|:------:|
| Tabla única con PK/SK | ✅ |
| GSI1 (por fecha) | ✅ |
| GSI2 (por categoría) | ✅ |
| GSI3 (inscripciones) | ✅ |
| Transacciones atómicas | ✅ |

</td>
<td width="50%" valign="top">

### 🔗 API REST
| Requisito | Estado |
|-----------|:------:|
| CRUD Talleres | ✅ |
| Sistema inscripciones | ✅ |
| Autenticación JWT | ✅ |
| Validación de entrada | ✅ |
| Códigos HTTP correctos | ✅ |
| Rate limiting (WAF) | ✅ |
| CORS configurado | ✅ |

### 🔐 Seguridad
| Requisito | Estado |
|-----------|:------:|
| WAF v2 (SQLi, XSS) | ✅ |
| IAM least-privilege | ✅ |
| Secrets Manager | ✅ |
| JWT Authorizer | ✅ |

### 📦 DevOps
| Requisito | Estado |
|-----------|:------:|
| AWS CDK (IaC) | ✅ |
| 7 Stacks modulares | ✅ |
| CloudWatch Logs | ✅ |
| X-Ray Tracing | ✅ |
| Alarmas SNS | ✅ |

</td>
</tr>
</table>

<br/>

## 📁 Estructura del Proyecto

```
📦 SkillsForge
├── 🎨 app/                         # Next.js 15 App Router
│   ├── admin/                      # Panel administrador
│   ├── estudiantes/                # Portal estudiantes
│   ├── api/                        # API Routes (proxy)
│   └── (pages)/                    # Páginas públicas
│
├── 🧩 frontend/
│   ├── components/                 # React Components
│   │   ├── admin/                  # Formularios admin
│   │   ├── ai/                     # Chat IA, Insights
│   │   ├── shared/                 # UI compartida
│   │   └── workshops/              # Cards, botones
│   ├── lib/                        # Utilidades, hooks
│   └── types/                      # TypeScript types
│
├── ⚡ backend-services/
│   ├── functions/                  # Lambda Handlers
│   │   ├── auth/                   # 🔐 login, register, refresh
│   │   ├── workshops/              # 📚 CRUD, stats, categories
│   │   ├── registrations/          # 📝 register, unregister, list
│   │   ├── events/                 # 📨 processor, reminder
│   │   ├── students/               # 👥 list, delete
│   │   └── ai/                     # 🤖 assistant (Bedrock)
│   └── shared/                     # Lambda Layer (boto3, jwt)
│
└── 🏗️ infrastructure/
    └── lib/stacks/                 # CDK Stacks
        ├── api-stack.ts            # API Gateway + Lambdas
        ├── auth-stack.ts           # Cognito
        ├── data-stack.ts           # DynamoDB
        ├── events-stack.ts         # EventBridge + SNS
        ├── frontend-stack.ts       # (Legacy S3/CF)
        ├── monitoring-stack.ts     # CloudWatch + Alarms
        └── security-stack.ts       # WAF + IAM
```

<br/>

## 🚀 Instalación

<details open>
<summary><b>Requisitos previos</b></summary>

- Node.js 18+
- Python 3.11
- AWS CLI configurado
- Cuenta de Vercel

</details>

### Backend (AWS)

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/skillsforge.git
cd skillsforge

# 2. Instalar dependencias
npm install
cd infrastructure && npm install

# 3. Configurar variables
cp .env.example .env
# Editar .env con tus valores

# 4. Desplegar a AWS
cdk bootstrap
cdk deploy --all
```

### Frontend (Vercel)

```bash
# Opción 1: Deploy automático
# Conectar repo en vercel.com → Import Project

# Opción 2: CLI
npm i -g vercel
vercel --prod
```

### Desarrollo Local

```bash
# Frontend
npm run dev                    # localhost:3000

# Variables de entorno necesarias
NEXT_PUBLIC_API_URL=https://qt6hwpaad0.execute-api.us-east-1.amazonaws.com/dev
```

<br/>

## 🔒 Seguridad

<details>
<summary><b>🛡️ Ver diagrama de capas de seguridad</b></summary>
<br/>

```mermaid
flowchart TB
    subgraph Internet
        USER["👤 Usuario"]
        ATTACKER["🦹 Atacante"]
    end
    
    subgraph Layer1 ["Capa 1: Edge"]
        WAF["🛡️ AWS WAF v2"]
    end
    
    subgraph Layer2 ["Capa 2: Auth"]
        COGNITO["🔐 Cognito"]
        JWT["JWT Authorizer"]
    end
    
    subgraph Layer3 ["Capa 3: API"]
        THROTTLE["⏱️ Throttling"]
        CORS["🌐 CORS"]
        VALIDATE["✅ Validación"]
    end
    
    subgraph Layer4 ["Capa 4: Data"]
        IAM["🔑 IAM Roles"]
        ENCRYPT["🔒 Encryption"]
    end
    
    USER --> WAF
    ATTACKER --> WAF
    WAF -->|"❌ SQLi/XSS"| BLOCK["🚫 Blocked"]
    WAF -->|"✅ Clean"| COGNITO
    COGNITO --> JWT
    JWT --> THROTTLE --> CORS --> VALIDATE
    VALIDATE --> IAM --> ENCRYPT
```

</details>

| Capa | Protección | Configuración |
|------|------------|---------------|
| **WAF** | Rate limit, SQLi, XSS | 2000 req/5min, AWS Managed Rules |
| **Cognito** | Autenticación | JWT RS256, refresh tokens |
| **API Gateway** | Throttling | 1000 req/s burst, 500 req/s steady |
| **IAM** | Autorización | Least privilege, sin wildcards |
| **DynamoDB** | Datos | Encryption at rest (AES-256) |

<br/>

## 📈 Monitoreo y Observabilidad

<details>
<summary><b>📊 Ver diagrama de observabilidad</b></summary>
<br/>

```mermaid
flowchart LR
    subgraph Sources ["📊 Fuentes"]
        L["Lambda Logs"]
        API["API Gateway"]
        DDB["DynamoDB"]
    end
    
    subgraph CloudWatch ["☁️ CloudWatch"]
        LOGS["📝 Log Groups"]
        METRICS["📊 Metrics"]
        DASH["📈 Dashboard"]
        ALARMS["🚨 Alarms"]
    end
    
    subgraph XRay ["🔍 X-Ray"]
        TRACES["Traces"]
        MAP["Service Map"]
    end
    
    subgraph Alerts ["🔔 Alertas"]
        SNS["📧 SNS"]
        EMAIL["Email Admin"]
    end
    
    L & API & DDB --> LOGS --> METRICS --> DASH
    METRICS --> ALARMS --> SNS --> EMAIL
    L & API --> TRACES --> MAP
```

</details>

> [!WARNING]
> Las alarmas notifican automáticamente cuando:
> - Errores 5XX > 10 en 5 minutos
> - Lambda errors > 5%
> - DLQ con mensajes pendientes
> - Throttling activado

<br/>

## 💰 Costos

> [!NOTE]
> Todo el proyecto opera dentro del **AWS Free Tier** 🎉

| Servicio | Uso Mensual Free | Nuestro Uso |
|----------|------------------|-------------|
| Lambda | 1M requests | ~10K ✅ |
| API Gateway | 1M requests | ~10K ✅ |
| DynamoDB | 25 GB | ~50 MB ✅ |
| Cognito | 50K MAU | ~10 ✅ |
| EventBridge | 14M events | ~1K ✅ |
| SNS | 1M publish | ~100 ✅ |
| CloudWatch | 10 metrics | ~5 ✅ |
| **Vercel** | 100GB bandwidth | ~1GB ✅ |
| **Bedrock Nova** | Free tier | ✅ |

<br/>

## 🤝 Contribuir

```bash
# 1. Fork del repositorio
# 2. Crear branch
git checkout -b feature/nueva-funcionalidad

# 3. Hacer cambios y commit
git commit -m "feat: agregar nueva funcionalidad"

# 4. Push y crear PR
git push origin feature/nueva-funcionalidad
```

<br/>

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

<br/>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=180&section=footer&text=Desarrollado%20con%20☕%20%2B%20🎵%20usando%20AWS%20y%20Vercel&fontSize=16&fontColor=ffffff&fontAlignY=55&desc=©%202025%20SkillsForge%20—%20Todos%20los%20derechos%20reservados&descSize=14&descAlignY=80" width="100%" />
</p>
