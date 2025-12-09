import { Router } from "express";
import { addWhatsAppTemplate, deleteWhatsAppTemplate, getWhatsAppTemplate, getWhatsAppTemplateByProject } from "../../controller/whatsappTemplate.controller.js";

const whatsAppTemplateRouter =Router();

whatsAppTemplateRouter.get("/all-templates",getWhatsAppTemplate); 
whatsAppTemplateRouter.get("/template-by-project/:id",getWhatsAppTemplateByProject);
whatsAppTemplateRouter.post("/add-whatsapp-template", addWhatsAppTemplate);
whatsAppTemplateRouter.delete("/delete-whatsapp-template/:id",deleteWhatsAppTemplate);


export default whatsAppTemplateRouter;

