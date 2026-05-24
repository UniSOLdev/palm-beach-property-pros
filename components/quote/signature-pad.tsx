"use client";

import { forwardRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import type ReactSignatureCanvas from "react-signature-canvas";

type Props = React.ComponentProps<typeof SignatureCanvas>;

const SignaturePad = forwardRef<ReactSignatureCanvas, Props>(function SignaturePad(props, ref) {
  return <SignatureCanvas ref={ref} {...props} />;
});

export default SignaturePad;
