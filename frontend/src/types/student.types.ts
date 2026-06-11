export interface StudentDto {
    id?: number;
    username?: string;
    fullName: string;
    firstName: string | null;
    thirdName: string | null; // LastName
    studentIdNumber: string | null;
    email?: string | null;
    group: { 
        name: string | null;
        educationLang?: { code: string | null; name?: string | null } | null;
    } | null;
    level?: { code: string | null; name?: string | null } | null; // Course
    semester?: { code: string | null; name?: string | null } | null;
    studentStatus?: { code: string | null; name?: string | null } | null;
    faculty?: { id?: number | null; name: string | null } | null;
    specialty?: { id?: number | null; name: string | null } | null;
}
