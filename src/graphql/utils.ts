import { DateTime } from "luxon";

export const getNow = () => {
    const now  = DateTime.now().toJSDate();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset); 
}