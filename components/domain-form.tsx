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
}

export function DomainForm({
  onSubmit,
  onCancel,
  initialData,
}: DomainFormProps) {
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
      newErrors.name = "Domain name is required";
    } else if (
      !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(
        formData.name
      )
    ) {
      newErrors.name = "Please enter a valid domain name";
    }

    if (!formData.expireDate) {
      newErrors.expireDate = "Expiration date is required";
    }

    if (!formData.company) {
      newErrors.company = "Company is required";
    }

    if (!formData.registrar.trim()) {
      newErrors.registrar = "Registrar is required";
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
            {initialData ? "Edit Domain" : "Add New Domain"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Fields marked with <span className="text-destructive">*</span> are
            required
          </p>
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center">
              Domain Name <span className="text-destructive ml-1">*</span>
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
              Expiration Date <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="expireDate"
              name="expireDate"
              type="date"
              value={formData.expireDate}
              onChange={handleChange}
              className={errors.expireDate ? "border-destructive" : ""}
              disabled={isSubmitting}
              required
            />
            {errors.expireDate && (
              <p className="text-sm text-destructive">{errors.expireDate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center">
              Company <span className="text-destructive ml-1">*</span>
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
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gfc">GFC SP. Z.O.O</SelectItem>
                <SelectItem value="logbox">Logbox SP. Z.O.O.</SelectItem>
              </SelectContent>
            </Select>
            {errors.company && (
              <p className="text-sm text-destructive">{errors.company}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrar" className="flex items-center">
              Registrar <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="registrar"
              name="registrar"
              value={formData.registrar}
              onChange={handleChange}
              placeholder="np. Cyberfolks"
              className={errors.registrar ? "border-destructive" : ""}
              disabled={isSubmitting}
              required
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
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2">
                    <svg
                      className="animate-spin h-4 w-4 text-current"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </span>
                  {initialData ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>{initialData ? "Update" : "Add"} Domain</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
