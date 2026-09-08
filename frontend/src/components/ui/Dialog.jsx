import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import { LuX } from 'react-icons/lu';
import Button, { IconButton } from './Button';

/**
 * Modal built on the native <dialog> element: the browser handles focus trapping, Escape and the
 * backdrop. `onClose` fires for Escape, the close button and backdrop clicks.
 */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return undefined;
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    const handleCancel = (event) => {
      event.preventDefault();
      onClose();
    };
    const handleClick = (event) => {
      if (event.target === dialog) onClose();
    };
    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleClick);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      className={`m-auto w-[calc(100%-2rem)] ${widths[size]} rounded-lg border border-line bg-surface p-0 text-ink shadow-pop open:flex open:flex-col`}
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div>
          <h2 id="dialog-title" className="text-title font-semibold">
            {title}
          </h2>
          {description && <p className="mt-1 text-small text-ink-muted">{description}</p>}
        </div>
        <IconButton icon={LuX} label="Close" onClick={onClose} className="-mr-2 -mt-1" />
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-line bg-sunken px-5 py-3 rounded-b-lg">{footer}</div>}
    </dialog>
  );
}

Dialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  children: PropTypes.node,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

/** Yes/no question with a clearly named action. */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', danger = false, busy = false }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-body text-ink-muted">{description}</p>}
    </Dialog>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  confirmLabel: PropTypes.string,
  danger: PropTypes.bool,
  busy: PropTypes.bool,
};
