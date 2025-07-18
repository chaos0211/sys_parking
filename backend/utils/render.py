from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="templates")

def render_with_user(request, template_name: str, context: dict = {}):
    context["request"] = request
    context["user"] = getattr(request.state, "user", None)
    return templates.TemplateResponse(template_name, context)