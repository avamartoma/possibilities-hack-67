# Career Map v5

The product flow is `Locked[IN] → Discover or Career Guide → Your Path`.
Role selection is direct; there is no modal or comparison step. The shared Render
FastAPI service owns the Anthropic key and provides the career-guide chat endpoint.
The frontend defaults to that service and local development may set
`CAREER_API_URL=http://localhost:8000`. Opportunities are fictional generated demo
data. See `render.yaml` and `.env.example` for deployment configuration.
