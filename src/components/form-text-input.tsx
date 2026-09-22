import type { InputHTMLAttributes } from "react";

type FormTextInputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "className" | "value" | "onChange"
> & {
    id: string;
    value: string;
    invalid?: boolean;
    onValueChange: (value: string) => void;
};

export function FormTextInput({
    id,
    value,
    invalid = false,
    onValueChange,
    disabled,
    ...rest
}: FormTextInputProps) {
    const showClear = value.length > 0 && !disabled;

    return (
        <div className="form-input-wrap">
            <input
                {...rest}
                id={id}
                value={value}
                disabled={disabled}
                className={`form-input form-input--with-clear${invalid ? " form-input--invalid" : ""}`}
                onChange={(e) => onValueChange(e.target.value)}
            />
            {showClear && (
                <button
                    type="button"
                    className="form-input-clear"
                    aria-label="Clear"
                    tabIndex={-1}
                    onClick={() => onValueChange("")}
                >
                    <span aria-hidden="true" className="form-input-clear-icon">
                        ×
                    </span>
                </button>
            )}
        </div>
    );
}
