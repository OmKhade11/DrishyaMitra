import * as React from "react";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "./utils";
import { Label } from "./label";

const Form = FormProvider;

const FormFieldContext = React.createContext({});

function FormField({ name, ...props }) {
  return (
    <FormFieldContext.Provider value={{ name }}>
      <Controller name={name} {...props} />
    </FormFieldContext.Provider>
  );
}

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const { formState } = useFormContext();

  const error = formState.errors?.[fieldContext?.name];

  return {
    name: fieldContext?.name,
    error,
  };
}

function FormItem({ className, ...props }) {
  return (
    <div
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

function FormLabel({ className, ...props }) {
  const { error } = useFormField();

  return (
    <Label
      className={cn(error && "text-red-600", className)}
      {...props}
    />
  );
}

function FormControl(props) {
  return <Slot {...props} />;
}

function FormDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  );
}

function FormMessage({ className }) {
  const { error } = useFormField();

  if (!error) return null;

  return (
    <p className={cn("text-sm text-red-600", className)}>
      {error.message}
    </p>
  );
}

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
};