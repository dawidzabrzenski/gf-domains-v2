"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import type { Domain } from "@/types/domain";
import { cn } from "@/lib/utils"; // Zakładam, że masz funkcję cn z Shadcn dla klas warunkowych

interface DomainFormProps {
  onSubmit: (domain: Domain | Omit<Domain, "id">) => void | Promise<void>;
  onCancel: () => void;
  initialData?: Domain | null;
  mode?: "add" | "request";
  onModeReset?: () => void;
}

export function DomainForm({
  onSubmit,
  onCancel,
  initialData,
  mode = "add",
  onModeReset,
}: DomainFormProps) {
  const isRequesting = mode === "request";

  const [formData, setFormData] = useState<Omit<Domain, "id"> | Domain>({
    name: initialData?.name || "",
    expireDate: initialData?.expireDate || "",
    company: initialData?.company || "",
    registrar: initialData?.registrar || "",
    resignation: initialData?.resignation || false,
    archived: initialData?.archived || false,
    ...(initialData?.id ? { id: initialData.id } : {}),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    const updatedFormData = { ...formData, [name]: checked };

    // Jeśli archived jest zaznaczane, resetujemy expireDate i resignation
    if (name === "archived" && checked) {
      updatedFormData.expireDate = "";
      updatedFormData.resignation = false;
    }

    setFormData(updatedFormData);
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nazwa domeny jest wymagana";
    } else if (
      !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](\.[a-zA-Z0-9-]{1,61}[a-zA-Z0-9])*\.[a-zA-Z]{2,}$/.test(
        formData.name
      )
    ) {
      newErrors.name = "Wprowadź poprawną domenę";
    }

    if (!formData.expireDate && !isRequesting && !formData.archived) {
      newErrors.expireDate = "Data wygaśnięcia jest wymagana";
    }

    if (!formData.company) {
      newErrors.company = "Spółka jest wymagana";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error("Error submitting form:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    onCancel();
    if (onModeReset) onModeReset();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? "Edytuj domenę"
              : isRequesting
              ? "Zleć zakup domeny"
              : "Dodaj nową domenę"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Edytuj dane istniejącej domeny."
              : isRequesting
              ? "Zleć zakup nowej domeny, wypełniając wymagane pola."
              : "Dodaj nową domenę do systemu, wypełniając wymagane pola."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Pola zaznaczone przez <span className="text-destructive">*</span> są
            wymagane
          </p>

          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center">
              Domena <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="example.com"
              className={errors.name ? "border-destructive" : ""}
              disabled={isSubmitting}
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {!isRequesting && (
            <div className="space-y-2">
              <Label htmlFor="expireDate" className="flex items-center">
                Data wygaśnięcia{" "}
                {!isRequesting && !formData.archived && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              <Input
                id="expireDate"
                name="expireDate"
                type="date"
                value={formData.expireDate}
                onChange={handleChange}
                className={errors.expireDate ? "border-destructive" : ""}
                disabled={isSubmitting || isRequesting || formData.archived}
              />
              {errors.expireDate && (
                <p className="text-sm text-destructive">{errors.expireDate}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center">
              Spółka <span className="text-destructive ml-1">*</span>
            </Label>
            <Select
              value={formData.company}
              onValueChange={(value) => handleSelectChange("company", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="company"
                className={errors.company ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Wybierz spółkę" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GFC SP. Z.O.O">GFC SP. Z.O.O</SelectItem>
                <SelectItem value="Logbox SP. Z.O.O.">
                  Logbox SP. Z.O.O.
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.company && (
              <p className="text-sm text-destructive">{errors.company}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrar" className="flex items-center">
              Rejestrator
            </Label>
            <Input
              id="registrar"
              name="registrar"
              value={formData.registrar}
              onChange={handleChange}
              placeholder="np. Cyberfolks"
              className={errors.registrar ? "border-destructive" : ""}
              disabled={isSubmitting}
            />
            {errors.registrar && (
              <p className="text-sm text-destructive">{errors.registrar}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resignation" className="flex items-center">
              Rezygnacja
            </Label>
            <div className="flex items-center space-x-2">
              <CheckboxPrimitive.Root
                id="resignation"
                checked={formData.resignation}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("resignation", checked === true)
                }
                disabled={isSubmitting || formData.archived}
                className={cn(
                  "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  formData.resignation && "bg-primary text-primary-foreground"
                )}
              >
                <CheckboxPrimitive.Indicator
                  className={cn(
                    "flex items-center justify-center text-current"
                  )}
                >
                  <Check className="h-4 w-4" />
                </CheckboxPrimitive.Indicator>
              </CheckboxPrimitive.Root>
              <label
                htmlFor="resignation"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                Zaznacz, aby oznaczyć rezygnację
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="archived" className="flex items-center">
              Zarchiwizowana
            </Label>
            <div className="flex items-center space-x-2">
              <CheckboxPrimitive.Root
                id="archived"
                checked={formData.archived}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("archived", checked === true)
                }
                disabled={isSubmitting}
                className={cn(
                  "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  formData.archived && "bg-primary text-primary-foreground"
                )}
              >
                <CheckboxPrimitive.Indicator
                  className={cn(
                    "flex items-center justify-center text-current"
                  )}
                >
                  <Check className="h-4 w-4" />
                </CheckboxPrimitive.Indicator>
              </CheckboxPrimitive.Root>
              <label
                htmlFor="archived"
                className="text-sm  font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                Zaznacz, aby oznaczyć jako zarchiwizowaną
              </label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2 animate-spin h-4 w-4">⏳</span>
                  {initialData
                    ? "Edytowanie..."
                    : isRequesting
                    ? "Zlecanie..."
                    : "Dodawanie..."}
                </>
              ) : (
                <>
                  {initialData ? "Edytuj" : isRequesting ? "Zleć" : "Dodaj"}{" "}
                  Domenę
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
