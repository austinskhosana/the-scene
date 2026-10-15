'use client';

import type {ElementType} from 'react';
import {Radio as RadioPrimitive} from '@base-ui/react/radio';
import {RadioGroup as RadioGroupPrimitive} from '@base-ui/react/radio-group';
import {Checkmark, Icon} from '@/components/lime/icon';
import {cn, mergeClass} from '@/lib/lime/utils';

// One choice from a short list, all options visible. Chosen fills with the lime, an olive edge and a
// near-black dot. For more than about six options use Select. For a view switch use Segmented.

function RadioGroup({className, ...props}: RadioGroupPrimitive.Props) {
  return <RadioGroupPrimitive data-slot="radio-group" className={mergeClass('flex flex-col gap-3', className)} {...props}/>;
}

type RadioProps = RadioPrimitive.Root.Props & {appearance?: 'circle' | 'check'};

function Radio({appearance = 'circle', className, ...props}: RadioProps) {
  return (
    <RadioPrimitive.Root
      data-slot="radio"
      data-appearance={appearance}
      className={mergeClass(
        appearance === 'check'
          ? [
              'inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-transparent',
              'transition-colors duration-(--dur-fast) ease-out data-checked:text-fg',
              'data-disabled:cursor-not-allowed data-disabled:text-fg-disabled',
            ]
          : [
              'inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-control bg-page',
              'transition-[background-color,border-color] duration-(--dur-fast) ease-out',
              'hover:not-data-disabled:border-fg-2',
              'data-checked:border-accent-line data-checked:bg-accent',
              'data-disabled:cursor-not-allowed data-disabled:border-line-strong data-disabled:bg-surface-2',
            ],
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-indicator"
        className={appearance === 'check' ? 'text-current' : 'size-2 rounded-full bg-on-accent data-disabled:bg-fg-disabled'}
      >
        {appearance === 'check' ? <Icon icon={Checkmark} size={16} /> : null}
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

function RadioChoice({value, label, description, selected, icon: HeadingIcon}: {
  value: string;
  label: string;
  description: string;
  selected: boolean;
  icon?: ElementType;
}) {
  return (
    <label
      className={cn(
        'group flex min-h-(--control-lg) w-full cursor-pointer items-center justify-between gap-4 rounded-panel border border-transparent bg-surface px-4 py-4 text-start transition-[background-color,border-color,box-shadow] duration-(--dur-fast) ease-out',
        'hover:bg-surface-2 active:bg-surface-3',
        'has-[[data-slot=radio]:focus-visible]:outline-2 has-[[data-slot=radio]:focus-visible]:outline-ring has-[[data-slot=radio]:focus-visible]:outline-offset-2',
        selected && 'border-line-strong bg-surface-2 shadow-card hover:bg-surface-3',
      )}
    >
      <span className="flex min-w-0 items-start gap-3">
        {HeadingIcon ? (
          <HeadingIcon
            aria-hidden="true"
            className={cn(
              'size-5 shrink-0 transition-colors duration-(--dur-fast)',
              selected ? 'text-fg' : 'text-fg-2 group-hover:text-fg',
            )}
          />
        ) : null}
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-base leading-snug font-medium text-fg">{label}</span>
          <span className="text-sm leading-normal text-fg-2">{description}</span>
        </span>
      </span>
      <Radio value={value} appearance="check" />
    </label>
  );
}

export {RadioGroup, Radio, RadioChoice};
