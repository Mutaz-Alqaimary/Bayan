"use client";

/*
 * TEMPORARY Phase 3 verification harness — not product UI. Labels are sample
 * text (intentionally mixed Arabic/English to exercise BiDi). Remove with the
 * route before production.
 */

import { Bell, Plus, Search, Settings, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { useErrorMessages } from "@/lib/errors/client";
import { useValidationMessages } from "@/lib/validation/client";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 py-8">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="rounded-xl border border-border bg-card p-6">
        {children}
      </div>
    </section>
  );
}

const students = [
  { id: "1023", name: "سارة المنصوري", grade: "الصف الرابع", wpm: 96 },
  { id: "1024", name: "Omar Haddad", grade: "Grade 4", wpm: 88 },
  { id: "1025", name: "ليان عبدالله", grade: "الصف الخامس", wpm: 74 },
];

export function UiGallery() {
  const tCommon = useTranslations("common");
  const errorMessages = useErrorMessages();
  const validationMessages = useValidationMessages();
  const [emailValue, setEmailValue] = useState("");

  const emailSchema = z
    .string()
    .min(3, { error: validationMessages.tooShort(3) })
    .max(40, { error: validationMessages.tooLong(40) })
    .pipe(z.email({ error: validationMessages.invalidEmail() }));
  const emailResult = emailValue ? emailSchema.safeParse(emailValue) : null;
  const emailError = emailResult && !emailResult.success ? emailResult.error.issues[0]?.message : undefined;

  return (
    <div className="space-y-2">
      <header className="py-4">
        <h1 className="text-2xl font-bold tracking-tight">Design System</h1>
        <p className="text-sm text-muted-foreground">
          Phase 3 component gallery — toggle language/theme in the header to
          verify RTL/LTR and light/dark.
        </p>
      </header>

      {/* Button */}
      <Section id="button" title="Button">
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add">
            <Plus />
          </Button>
          <Button>
            <Search /> With icon
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      {/* Input / Textarea / Label */}
      <Section id="inputs" title="Input · Textarea · Label">
        <div className="grid max-w-md gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@school.edu" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name-ar">الاسم الكامل</Label>
            <Input id="name-ar" placeholder="اكتب اسم الطالب" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Add a note…" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invalid">Invalid example</Label>
            <Input id="invalid" aria-invalid defaultValue="bad value" />
          </div>
        </div>
      </Section>

      {/* Select */}
      <Section id="select" title="Select">
        <Select>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="اختر المستوى" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>المستويات</SelectLabel>
              <SelectItem value="1">المستوى الأول</SelectItem>
              <SelectItem value="2">المستوى الثاني</SelectItem>
              <SelectItem value="3">Level 3</SelectItem>
              <SelectItem value="4" disabled>
                Level 4 (disabled)
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Section>

      {/* Checkbox / Radio / Switch */}
      <Section id="toggles" title="Checkbox · Radio Group · Switch">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox id="c1" defaultChecked />
              <Label htmlFor="c1">تفعيل الإشعارات</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="c2" />
              <Label htmlFor="c2">Weekly report</Label>
            </div>
          </div>

          <RadioGroup defaultValue="teacher">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="admin" id="r-admin" />
              <Label htmlFor="r-admin">مدير</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="teacher" id="r-teacher" />
              <Label htmlFor="r-teacher">معلم</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="student" id="r-student" />
              <Label htmlFor="r-student">طالب</Label>
            </div>
          </RadioGroup>

          <div className="flex items-center gap-2">
            <Switch id="s1" defaultChecked />
            <Label htmlFor="s1">الوضع الداكن</Label>
          </div>
        </div>
      </Section>

      {/* Card */}
      <Section id="card" title="Card">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>تقدّم القراءة</CardTitle>
            <CardDescription>آخر ٣٠ يومًا</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            متوسط سرعة القراءة ٩٢ كلمة في الدقيقة بدقة ٩٤٪.
          </CardContent>
          <CardFooter>
            <Button size="sm">عرض التفاصيل</Button>
          </CardFooter>
        </Card>
      </Section>

      {/* Badge */}
      <Section id="badge" title="Badge">
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge>
            <Bell /> مع أيقونة
          </Badge>
        </div>
      </Section>

      {/* Skeleton */}
      <Section id="skeleton" title="Skeleton">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </Section>

      {/* Table */}
      <Section id="table" title="Table">
        <Table>
          <TableCaption>قائمة الطلاب (بيانات تجريبية)</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الطالب</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الصف</TableHead>
              <TableHead>WPM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.grade}</TableCell>
                <TableCell>{s.wpm}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      {/* Pagination */}
      <Section id="pagination" title="Pagination">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#pagination">السابق</PaginationPrevious>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#pagination">١</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#pagination" isActive>
                ٢
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#pagination">٣</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#pagination">التالي</PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Section>

      {/* Overlays */}
      <Section id="overlays" title="Dialog · Drawer · Dropdown · Tooltip">
        <div className="flex flex-wrap gap-3">
          {/* Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>حذف الطالب</DialogTitle>
                <DialogDescription>
                  لا يمكن التراجع عن هذا الإجراء. سيتم حذف السجل نهائيًا.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">إلغاء</Button>
                </DialogClose>
                <Button variant="destructive">حذف</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Drawers — all four sides */}
          {(["start", "end", "top", "bottom"] as const).map((side) => (
            <Drawer key={side}>
              <DrawerTrigger asChild>
                <Button variant="outline">Drawer: {side}</Button>
              </DrawerTrigger>
              <DrawerContent side={side}>
                <DrawerHeader>
                  <DrawerTitle>Drawer ({side})</DrawerTitle>
                  <DrawerDescription>
                    يجب أن ينزلق من الجهة الصحيحة حسب اتجاه اللغة.
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">إغلاق</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          ))}

          {/* Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings /> Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>الحساب</DropdownMenuLabel>
              <DropdownMenuItem>
                <User /> الملف الشخصي
                <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem defaultChecked>
                إظهار البريد
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>المزيد</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>الإعدادات</DropdownMenuItem>
                  <DropdownMenuItem>المساعدة</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Notifications">
                <Bell />
              </Button>
            </TooltipTrigger>
            <TooltipContent>الإشعارات</TooltipContent>
          </Tooltip>
        </div>
      </Section>

      {/* Tabs */}
      <Section id="tabs" title="Tabs">
        <Tabs defaultValue="overview" className="max-w-lg">
          <TabsList>
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="sessions">الجلسات</TabsTrigger>
            <TabsTrigger value="vocab">المفردات</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="text-sm text-muted-foreground">
            ملخص أداء الطالب.
          </TabsContent>
          <TabsContent value="sessions" className="text-sm text-muted-foreground">
            سجلّ جلسات القراءة.
          </TabsContent>
          <TabsContent value="vocab" className="text-sm text-muted-foreground">
            المفردات المكتسبة.
          </TabsContent>
        </Tabs>
      </Section>

      {/* Validation — live, localized, dynamic Zod messages (lib/validation) */}
      <Section id="validation" title="Validation (Zod + next-intl)">
        <div className="grid max-w-md gap-1.5">
          <div className="grid gap-2">
            <Label htmlFor="validation-email">Email</Label>
            <Input
              id="validation-email"
              type="email"
              value={emailValue}
              onChange={(event) => setEmailValue(event.target.value)}
              aria-invalid={Boolean(emailError)}
              aria-describedby="validation-email-error"
              placeholder="name@school.edu"
            />
          </div>
          <p
            id="validation-email-error"
            aria-live="polite"
            aria-atomic="true"
            className="min-h-5 text-sm text-destructive-text"
          >
            {emailError ?? ""}
          </p>
        </div>
      </Section>

      {/* Toast — localized via lib/errors (destructive) and the common namespace (success) */}
      <Section id="toast" title="Toast">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: tCommon("savedTitle"),
                description: tCommon("savedDescription"),
              })
            }
          >
            Show toast
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: "destructive",
                title: errorMessages.generic.title,
                description: errorMessages.generic.description,
              })
            }
          >
            Show error toast
          </Button>
        </div>
      </Section>

      {/* Empty / Error states */}
      <Section id="states" title="EmptyState · ErrorState">
        <div className="grid gap-6 md:grid-cols-2">
          <EmptyState
            title="لا يوجد طلاب بعد"
            description="ابدأ بإضافة أول طالب لمتابعة تقدّمه في القراءة."
            action={
              <Button size="sm">
                <Plus /> إضافة طالب
              </Button>
            }
          />
          <ErrorState
            title="تعذّر تحميل البيانات"
            description="حدث خطأ غير متوقع أثناء جلب البيانات."
            action={
              <Button size="sm" variant="outline">
                إعادة المحاولة
              </Button>
            }
          />
        </div>
      </Section>
    </div>
  );
}
