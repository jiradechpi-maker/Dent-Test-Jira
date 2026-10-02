# Gotenberg (LibreOffice headless) with the Thai government fonts installed,
# so PDFs look exactly like the .docx opened in MS Word.
FROM gotenberg/gotenberg:8

USER root

# TH Sarabun New (SIPA/DIP free government font) + TLWG Thai fonts as a fallback.
COPY fonts/*.ttf /usr/local/share/fonts/th-sarabun/
# Documents written in Word reference "TH SarabunPSK" — map it to TH Sarabun New.
COPY 60-th-sarabun-alias.conf /etc/fonts/conf.d/60-th-sarabun-alias.conf

RUN apt-get update \
 && apt-get install -y --no-install-recommends fonts-thai-tlwg \
 && rm -rf /var/lib/apt/lists/* \
 && fc-cache -f

USER gotenberg
