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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Domain } from "@/types/domain";

interface DomainFormProps {
  onSubmit: (domain: Domain | Omit<Domain, "id">) => void | Promise<void>;
  onCancel: () => void;
  initialData?: Domain | null;
  mode?: "add" | "request";
}

export function DomainForm({
  onSubmit,
  onCancel,
  initialData,
  mode = "add",
}: DomainFormProps) {
  const isRequesting = mode === "request";

  const [formData, setFormData] = useState<Omit<Domain, "id"> | Domain>({
    name: initialData?.name || "",
    expireDate: initialData?.expireDate || "",
    company: initialData?.company || "",
    registrar: initialData?.registrar || "",
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

    if (!formData.expireDate && !isRequesting) {
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

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? "Edytuj domenę"
              : isRequesting
              ? "Zleć zakupy domeny"
              : "Dodaj nową domenę"}
          </DialogTitle>
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

          <div className="space-y-2">
            <Label htmlFor="expireDate" className="flex items-center">
              Data wygaśnięcia <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="expireDate"
              name="expireDate"
              type="date"
              value={formData.expireDate}
              onChange={handleChange}
              className={errors.expireDate ? "border-destructive" : ""}
              disabled={isSubmitting || isRequesting}
            />
            {errors.expireDate && (
              <p className="text-sm text-destructive">{errors.expireDate}</p>
            )}
          </div>

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
              Rejestrator <span className="text-destructive ml-1">*</span>
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

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
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
