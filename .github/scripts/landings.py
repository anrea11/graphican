#!/usr/bin/env python3
"""
Search landing pages for the free tools — one real, fully visible HTML page per
thing people type into Google («PDF-ийг Word болгох», «PDF нэгтгэх» …).

Each page: unique <title>/description/H1, short intro, a drop zone that hands the
file to the PDF editor (/tools/pdfedit/?do=<action>), 3 steps, features, FAQ,
JSON-LD (WebPage + BreadcrumbList + WebApplication + FAQPage) and links to
every other tool page.  Run by prerender.py (also usable on its own).
"""
import html, json, os, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SITE = "https://graphican.online"
V = "1"  # landing.css / landing.js cache version

PDF = ".pdf,application/pdf"
IMG = "image/*,.heic,.heif,.tif,.tiff,.webp,.avif"
ANY = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.md,.html,.htm,.rtf,.odt,image/*,.heic,.heif,.tif,.tiff"

PRIV = ("Файл минь аюулгүй юу?",
        "Тийм. Файл таны хөтөч (browser) дотор боловсруулагддаг — сервер рүү илгээгдэхгүй, хаана ч хадгалагдахгүй. Хуудсаа хаавал бүх зүйл устана.")
FREE = ("Үнэгүй юу? Бүртгүүлэх шаардлагатай юу?",
        "Бүрэн үнэгүй. Бүртгэл, имэйл шаардахгүй, усан тэмдэг нэмэхгүй, ашиглах тоо хязгааргүй.")
PHONE = ("Утаснаас ашиглаж болох уу?",
         "Болно. iPhone, Android, планшет, компьютер — ямар ч орчин үеийн хөтөч дээр ажиллана. Програм суулгах шаардлагагүй.")

PAGES = [
    dict(slug="pdf-to-word", do="word", accept=PDF, short="PDF → Word",
         title="PDF-ийг Word болгох — үнэгүй онлайн хөрвүүлэгч | Graphican",
         h1="PDF-ийг Word болгох",
         desc="PDF файлаа засах боломжтой Word (DOCX) баримт болгоно. Кирилл, монгол бичиг зөв гарна. Үнэгүй, бүртгэлгүй, файл тань компьютерээс гарахгүй.",
         lead="PDF-ээ оруулаад нэг товшилтоор Word (.docx) болгоно. Догол мөр, гарчиг, текстийн дараалал хадгалагдаж, Microsoft Word болон Google Docs-оор шууд нээгдэнэ.",
         steps=["PDF файлаа доорх талбарт чирж оруулах эсвэл сонгох", "Засварлагч нээгдээд Word болгох цонх гарч ирнэ", "Бэлэн .docx файлаа татаж аваад Word-оор засна"],
         feats=[("Кирилл үсэг", "Монгол, орос бичвэр эвдрэлгүй хөрвөнө"), ("Скан PDF", "Зургаар хийсэн PDF-ийг эхлээд «Текст таних (OCR)»-оор бичиг болгоно"),
                ("Нууцлал", "Хөрвүүлэлт таны хөтөч дотор явагдана"), ("Хязгааргүй", "Хуудасны тоо, файлын тоо хязгаарлахгүй")],
         faq=[("Скан хийсэн PDF-ийг Word болгож болох уу?", "Болно. Засварлагчийн «AI хэрэгсэл → Текст таних (OCR)»-оор хуудсан дээрх бичгийг таниулаад дараа нь Word болгоно. Монгол, англи, орос хэлийг таньдаг."),
              ("Хөрвүүлэхэд хэр удаан вэ?", "Ихэнх PDF хэдхэн секундэд хөрвөнө. Хэдэн зуун хуудастай бол бага зэрэг удаж болно."),
              ("Word-ийг буцаад PDF болгож болох уу?", "Болно — «Word-ийг PDF болгох» хэрэгслийг ашиглана уу."), PRIV, FREE],
         related=["word-to-pdf", "pdf-to-excel", "pdf-ocr", "edit-pdf"]),

    dict(slug="word-to-pdf", do="topdf", accept=".doc,.docx,.odt,.rtf,.txt,.md,.html,.htm", multi=True, short="Word → PDF",
         title="Word-ийг PDF болгох (DOCX → PDF) — үнэгүй онлайн | Graphican",
         h1="Word-ийг PDF болгох",
         desc="Word (DOCX), TXT, HTML файлаа PDF болгоно. Монгол кирилл фонт зөв суугдана. Үнэгүй, бүртгэлгүй, програм суулгахгүй.",
         lead="Word баримтаа оруулахад PDF болж засварлагчид нээгдэнэ. Хүсвэл текст, гарын үсэг, хуудас нэмээд татаж авна. Кирилл үсэг бүхий фонт PDF-д бүрэн суугддаг тул хаана ч нээсэн ижил харагдана.",
         steps=["Word (.docx) файлаа доорх талбарт чирж оруулах", "Файл PDF болж засварлагчид нээгдэнэ", "«Татах» дарж PDF-ээ авна"],
         feats=[("Олон файл", "Хэд хэдэн Word файлыг нэг PDF болгож нэгтгэнэ"), ("Кирилл фонт", "Монгол үсэг «?» болж эвдрэхгүй"),
                ("Засаад татах", "PDF болгосны дараа текст, зураг, гарын үсэг нэмж болно"), ("Нууцлал", "Файл компьютерээс гарахгүй")],
         faq=[("Ямар файл PDF болгож болох вэ?", "Word (DOCX), Excel (XLSX, CSV), PowerPoint, TXT, Markdown, HTML болон JPG, PNG, HEIC, WebP, TIFF зураг."),
              ("Хэд хэдэн Word файлыг нэг PDF болгож болох уу?", "Болно. Бүгдийг нь зэрэг сонгоход дарааллаараа нэг PDF болно. Хуудсуудыг чирж дарааллыг нь сольж болно."),
              ("Хуучин .doc файл нээгдэх үү?", "Хуучин .doc форматыг Word-оор нээгээд .docx болгож хадгалсны дараа оруулна уу."), PRIV, FREE],
         related=["jpg-to-pdf", "pdf-to-word", "merge-pdf", "compress-pdf"]),

    dict(slug="pdf-to-excel", do="excel", accept=PDF, short="PDF → Excel",
         title="PDF-ийг Excel болгох — хүснэгт хөрвүүлэгч, үнэгүй онлайн | Graphican",
         h1="PDF-ийг Excel болгох",
         desc="PDF доторх хүснэгт, тоо баримтыг Excel (XLSX) болгоно. Хуудас бүр тусдаа sheet болно. Үнэгүй, бүртгэлгүй, файл тань компьютерээс гарахгүй.",
         lead="Тайлан, үнийн санал, хүснэгттэй PDF-ээ Excel (.xlsx) болгоод тоогоо шууд тооцоолж, шүүж ашиглана. Мөр, баганын байрлалыг текстийн байршлаар нь таньж задална.",
         steps=["PDF файлаа доорх талбарт оруулах", "Засварлагч нээгдээд Excel болгох цонх гарна", "Бэлэн .xlsx файлаа татаж Excel, Google Sheets-ээр нээнэ"],
         feats=[("Хуудас бүр sheet", "PDF-ийн хуудас бүр тусдаа хуудас (sheet) болно"), ("Тоо таних", "Тоо текст биш тоо болж орно"),
                ("Кирилл", "Монгол бичиг зөв гарна"), ("Нууцлал", "Файл сервер рүү илгээгдэхгүй")],
         faq=[("Бүх хүснэгт яг адилхан гарах уу?", "Энгийн хүснэгт сайн хөрвөнө. Нийлсэн нүд, нарийн хүрээтэй хүснэгтэд бага зэрэг засвар хэрэгтэй байж магадгүй."),
              ("Скан хийсэн PDF-ийг Excel болгож болох уу?", "Эхлээд засварлагчийн «Текст таних (OCR)»-ийг ажиллуулаад дараа нь Excel болгоно."), PRIV, FREE],
         related=["pdf-to-word", "pdf-to-ppt", "pdf-ocr", "pdf-to-jpg"]),

    dict(slug="pdf-to-ppt", do="ppt", accept=PDF, short="PDF → PowerPoint",
         title="PDF-ийг PowerPoint болгох (PPTX) — үнэгүй онлайн | Graphican",
         h1="PDF-ийг PowerPoint болгох",
         desc="PDF-ийн хуудас бүрийг PowerPoint (PPTX) слайд болгоно. Илтгэл, танилцуулгаа шууд засаж, үзүүлнэ. Үнэгүй, бүртгэлгүй.",
         lead="PDF хэлбэрээр ирсэн илтгэлээ PowerPoint (.pptx) болгоно. Хуудас бүр нэг слайд болж, Microsoft PowerPoint, Keynote, Google Slides-ээр нээгдэнэ.",
         steps=["PDF файлаа доорх талбарт оруулах", "Засварлагч нээгдээд PowerPoint болгох цонх гарна", "Бэлэн .pptx файлаа татаж аваад үзүүлнэ"],
         feats=[("Хуудас = слайд", "Хуудас бүр өндөр нягтралтай слайд болно"), ("Хэмжээ", "PDF-ийн харьцааг (16:9, A4) хадгална"),
                ("Хурдан", "Хэдэн секундэд бэлэн"), ("Нууцлал", "Файл компьютерээс гарахгүй")],
         faq=[("Слайд доторх текстийг засаж болох уу?", "Хуудас бүр слайд дээр зураг хэлбэрээр орж, үзүүлэхэд яг PDF шиг харагдана. Текстийг засах бол «PDF-ийг Word болгох»-ыг ашиглах эсвэл PDF засварлагч дээрээ шууд засна."), PRIV, FREE],
         related=["pdf-to-word", "pdf-to-jpg", "edit-pdf", "compress-pdf"]),

    dict(slug="pdf-to-jpg", do="jpg", accept=PDF, short="PDF → JPG",
         title="PDF-ийг зураг (JPG, PNG) болгох — үнэгүй онлайн | Graphican",
         h1="PDF-ийг зураг болгох (JPG, PNG)",
         desc="PDF-ийн хуудас бүрийг өндөр чанартай JPG эсвэл PNG зураг болгож, ZIP-ээр татна. Сошиалд оруулах, илгээхэд тохиромжтой. Үнэгүй, бүртгэлгүй.",
         lead="PDF-ийн хуудсуудыг зураг болгож сошиал медиа, мессенжерт хуваалцана. Хуудас бүр тусдаа JPG болж, бүгдийг нэг ZIP файлаар татна.",
         steps=["PDF файлаа доорх талбарт оруулах", "Хуудас бүр зураг болж хөрвөнө", "ZIP файлаа татаж, зургуудаа ашиглана"],
         feats=[("Өндөр нягтрал", "Хэвлэлд ч хүрэлцэхүйц тод зураг"), ("JPG, PNG, WebP", "PDF хөрвүүлэгч дээр формат, нягтралаа сонгоно"),
                ("PNG сонголт", "Тунгалаг, алдагдалгүй PNG-ээр ч гаргана"), ("Нууцлал", "Файл компьютерээс гарахгүй")],
         faq=[("Зөвхөн нэг хуудсыг зураг болгож болох уу?", "Болно. Засварлагч дээр хэрэггүй хуудсаа устгах эсвэл «PDF задлах»-аар салгаад дараа нь зураг болгоно."),
              ("Нягтрал, форматыг сонгож болох уу?", "Болно — <a href=\"/tools/pdf/\">PDF хөрвүүлэгч</a> дээр PNG, JPG, WebP болон нягтралаа сонгоно."), PRIV, FREE],
         related=["jpg-to-pdf", "pdf-to-ppt", "compress-pdf", "split-pdf"]),

    dict(slug="jpg-to-pdf", do="topdf", accept=IMG, multi=True, short="Зураг → PDF",
         title="Зургийг PDF болгох (JPG, PNG → PDF) — үнэгүй онлайн | Graphican",
         h1="Зургийг PDF болгох",
         desc="JPG, PNG, HEIC (iPhone), WebP зургуудаа нэг PDF болгоно. Дарааллаа чирж сольж, хуудас эргүүлнэ. Үнэгүй, бүртгэлгүй, файл тань компьютерээс гарахгүй.",
         lead="Утсаар авсан баримт, гэрчилгээ, тооцооны хуудас зэрэг зургуудаа нэг PDF файл болгож илгээнэ. iPhone-ы HEIC зураг ч шууд нээгдэнэ.",
         steps=["Зургуудаа доорх талбарт зэрэг сонгож оруулах", "Хуудсуудын дарааллыг чирж тааруулах, шаардлагатай бол эргүүлэх", "«Татах» дарж нэг PDF болгож авна"],
         feats=[("Олон зураг", "Хэдэн ч зургийг нэг PDF болгоно"), ("HEIC, WebP, TIFF", "iPhone болон бүх түгээмэл формат"),
                ("Засаад татах", "Текст, гарын үсэг, огноо нэмж болно"), ("Нууцлал", "Зураг компьютерээс гарахгүй")],
         faq=[("Зургийн дарааллыг яаж солих вэ?", "Зүүн талын хуудасны жагсаалтаас хуудсаа чирж байрлуулна."),
              ("iPhone-ы HEIC зураг ажиллах уу?", "Тийм, HEIC/HEIF зураг автоматаар хөрвөж PDF-д орно."),
              ("PDF хэт том болбол яах вэ?", "«PDF-ийн хэмжээ багасгах» хэрэгслээр шахаж жижигрүүлнэ."), PRIV, PHONE, FREE],
         related=["pdf-to-jpg", "merge-pdf", "compress-pdf", "word-to-pdf"]),

    dict(slug="translate-pdf", do="translate", accept=PDF, short="PDF орчуулах",
         title="PDF орчуулах — англи, орос, хятад → монгол, үнэгүй онлайн | Graphican",
         h1="PDF орчуулах",
         desc="PDF баримтаа хиймэл оюунаар монгол, англи, орос, хятад, солонгос, япон зэрэг 20 хэл рүү орчуулна. Хэв загвар нь хадгалагдана. Үнэгүй, бүртгэлгүй.",
         lead="Англи, орос, хятад хэл дээрх гэрээ, заавар, судалгааны PDF-ээ монгол хэл рүү (эсвэл эсрэгээр) орчуулна. Орчуулга нь эх хуудсан дээрээ байрандаа орж, PDF хэвээрээ татагдана.",
         steps=["PDF файлаа доорх талбарт оруулах", "Орчуулах хэлээ сонгоод «Орчуулах» дарна", "Орчуулсан PDF-ээ татаж авна"],
         feats=[("20 хэл", "Монгол, англи, орос, хятад, солонгос, япон, герман…"), ("Хэв загвар", "Орчуулга эх текстийн байрлалд орно"),
                ("AI орчуулга", "Llama 3.3 хиймэл оюун — утгаар нь орчуулна"), ("Скан PDF", "OCR-оор бичгийг таниулаад орчуулна")],
         faq=[("Ямар хэл рүү орчуулах вэ?", "Монгол, англи, орос, хятад, солонгос, япон, герман, франц, испани, итали, турк, казах зэрэг олон хэл."),
              ("Орчуулга хэр зөв бэ?", "Утга ойлгоход хангалттай чанартай AI орчуулга. Албан ёсны баримт бол хүнээр хянуулахыг зөвлөж байна."),
              ("Файл минь хаашаа илгээгдэх вэ?", "Зөвхөн орчуулах текстийн мөрүүд орчуулгын AI руу явж, хадгалагдахгүй. PDF файл өөрөө компьютерээс гарахгүй."), FREE],
         related=["pdf-ocr", "pdf-to-word", "edit-pdf", "summarize-pdf"]),

    dict(slug="merge-pdf", do="merge", accept=ANY, multi=True, short="PDF нэгтгэх",
         title="PDF нэгтгэх — олон PDF-ийг нэг болгох, үнэгүй онлайн | Graphican",
         h1="PDF нэгтгэх",
         desc="Хэд хэдэн PDF, зураг, Word файлыг нэг PDF болгож нэгтгэнэ. Хуудсын дарааллыг чирж солино. Үнэгүй, бүртгэлгүй, файл тань компьютерээс гарахгүй.",
         lead="Олон PDF-ээ нэг файл болгоно. PDF-ээс гадна зураг, Word, Excel файлыг ч хамт нэгтгэнэ. Хуудас бүрийг чирж байрлуулах, эргүүлэх, устгах боломжтой.",
         steps=["Нэгтгэх файлуудаа зэрэг сонгож оруулах", "Хуудсуудын дарааллыг чирж тааруулах", "«Татах» дарж нэг PDF болгоно"],
         feats=[("Холимог файл", "PDF + зураг + Word-ийг нэг дор"), ("Дараалал", "Хуудас бүрийг чирж байрлуулна"),
                ("Хуудас засах", "Эргүүлэх, устгах, хоосон хуудас нэмэх"), ("Хязгааргүй", "Файлын тоо, хэмжээ хязгаарлахгүй")],
         faq=[("Хэдэн файл нэгтгэж болох вэ?", "Хязгаар байхгүй. Маш олон, том файлтай бол компьютерийн санах ойгоос хамаарч бага зэрэг удаж болно."),
              ("Нэгтгэсний дараа нэмж файл оруулж болох уу?", "Болно — «Хуудас → Файл нэмэх» эсвэл файлаа засварлагч руу чирж оруулна."), PRIV, PHONE, FREE],
         related=["split-pdf", "compress-pdf", "jpg-to-pdf", "pdf-page-numbers"]),

    dict(slug="split-pdf", do="extract", accept=PDF, short="PDF задлах",
         title="PDF задлах, хуудас салгах — үнэгүй онлайн | Graphican",
         h1="PDF задлах, хуудас салгах",
         desc="PDF-ээс хэрэгтэй хуудсаа сонгож тусад нь салгах, эсвэл хуудас бүрийг тусдаа PDF болгоно. Үнэгүй, бүртгэлгүй, файл тань компьютерээс гарахгүй.",
         lead="Том PDF-ээс зөвхөн хэрэгтэй хуудсуудаа (жишээ нь 3–7) салгаж шинэ PDF болгоно. Эсвэл бүх хуудсыг тус тусад нь PDF болгоод ZIP-ээр татна.",
         steps=["PDF файлаа доорх талбарт оруулах", "Салгах хуудсаа (1-3, 5 гэх мэт) бичих эсвэл сонгох", "Шинэ PDF-ээ татаж авна"],
         feats=[("Хуудасны муж", "1-3, 5, 8-10 гэх мэт хэлбэрээр сонгоно"), ("Бүгдийг салгах", "Хуудас бүр тусдаа PDF, нэг ZIP-д"),
                ("Устгах", "Хэрэггүй хуудсаа устгаад хадгална"), ("Нууцлал", "Файл компьютерээс гарахгүй")],
         faq=[("Хуудас бүрийг тусдаа файл болгож болох уу?", "Болно — «Хуудас → Бүгдийг салгах» нь хуудас бүрийг тусдаа PDF болгоод ZIP-ээр өгнө."),
              ("Хуудас устгаж болох уу?", "Болно. Хуудсаа сонгоод устгах товч дарна, дараа нь «Татах»."), PRIV, FREE],
         related=["merge-pdf", "compress-pdf", "pdf-to-jpg", "edit-pdf"]),

    dict(slug="compress-pdf", do="compress", accept=PDF, short="PDF шахах",
         title="PDF-ийн хэмжээ багасгах (шахах) — үнэгүй онлайн | Graphican",
         h1="PDF-ийн хэмжээ багасгах",
         desc="Том PDF-ийг имэйл, E-Mongolia, цахим өргөдөлд тохирох хэмжээнд шахаж жижигрүүлнэ. Чанарын түвшнээ сонгоно. Үнэгүй, бүртгэлгүй.",
         lead="Имэйлээр явахгүй, сайтад оруулахад «файл хэт том» гэж гардаг PDF-ээ шахна. Хэмжээ 70–90% хүртэл багасч, унших чанар хэвээр үлдэнэ.",
         steps=["PDF файлаа доорх талбарт оруулах", "Чанараа (сайн, дунд, жижиг) сонгох", "Жижигрүүлсэн PDF-ээ татаж авна"],
         feats=[("3 түвшин", "Чанар ба хэмжээний тэнцвэрээ сонгоно"), ("Үр дүн", "Хэдэн хувь багассаныг шууд харуулна"),
                ("Скан баримт", "Утсаар авсан том зурагтай PDF-д хамгийн их нөлөөтэй"), ("Нууцлал", "Файл компьютерээс гарахгүй")],
         faq=[("Хэдэн хувь жижгэрэх вэ?", "Зурагтай, скан хийсэн PDF 70–90% жижгэрэх нь элбэг. Зөвхөн тексттэй PDF аль хэдийн жижиг байдаг."),
              ("Чанар муудах уу?", "«Сайн» түвшин бараг ялгаагүй, «Жижиг» түвшин хамгийн бага хэмжээтэй боловч зураг бага зэрэг бүдгэрнэ."),
              ("Шахсан PDF-ийн текст хуулагдах уу?", "Шахалт хуудсыг зураг болгодог тул текстийг хуулах бол «Текст таних (OCR)»-ийг дараа нь ажиллуулна."), PRIV, FREE],
         related=["merge-pdf", "jpg-to-pdf", "split-pdf", "protect-pdf"]),

    dict(slug="sign-pdf", do="sig", accept=PDF, short="Гарын үсэг",
         title="PDF-д гарын үсэг зурах — цахим гарын үсэг, үнэгүй онлайн | Graphican",
         h1="PDF-д гарын үсэг зурах",
         desc="Гэрээ, өргөдөл, акт зэрэг PDF дээр гарын үсгээ зурж, бичиж эсвэл зургаар оруулна. Огноо, товчилсон нэр нэмнэ. Үнэгүй, бүртгэлгүй, хэвлэх шаардлагагүй.",
         lead="Хэвлэж, гарын үсэг зураад, дахин скан хийх шаардлагагүй. Хулгана, хуруу эсвэл бичгээр гарын үсгээ үүсгээд PDF дээрээ байрлуулна.",
         steps=["PDF файлаа доорх талбарт оруулах", "Гарын үсгээ зурах, бичих эсвэл зургаа оруулах", "Байрлалаа тааруулаад «Татах» дарна"],
         feats=[("3 арга", "Зурах, бичих, зураг оруулах"), ("Огноо, тэмдэглэгээ", "Огноо, ✓ ✗, товчилсон нэр нэмэх"),
                ("Утаснаас", "Хуруугаараа гарын үсэг зурна"), ("Нууцлал", "Гарын үсэг тань хаана ч хадгалагдахгүй")],
         faq=[("Энэ хууль ёсны цахим гарын үсэг мөн үү?", "Энэ нь гарын үсгийн зургийг PDF-д байрлуулдаг. Тоон гэрчилгээтэй (e-sign) гарын үсэг шаарддаг албан бичигт тусгай үйлчилгээ хэрэглэнэ."),
              ("Утаснаас гарын үсэг зурж болох уу?", "Болно — хуруугаараа дэлгэц дээр зурна."),
              ("Бусдаар бөглүүлэх талбар нэмж болох уу?", "Болно — «Талбар нэмэх»-ээр бөглөх текст, чагт, гарын үсгийн талбар үүсгэнэ."), PRIV, FREE],
         related=["edit-pdf", "protect-pdf", "fill-pdf", "compress-pdf"]),

    dict(slug="protect-pdf", do="pw", accept=PDF, short="Нууц үг тавих",
         title="PDF-д нууц үг тавих — файлаа түгжих, үнэгүй онлайн | Graphican",
         h1="PDF-д нууц үг тавих",
         desc="PDF файлаа нууц үгээр түгжиж, зөвхөн нууц үг мэдэх хүн нээдэг болгоно. Хэвлэх, хуулахыг хориглож болно. Үнэгүй, бүртгэлгүй.",
         lead="Цалингийн хуудас, гэрээ, хувийн мэдээлэлтэй PDF-ээ нууц үгээр хамгаална. Шифрлэлт таны төхөөрөмж дээр хийгддэг тул нууц үг, файл хаашаа ч илгээгдэхгүй.",
         steps=["PDF файлаа доорх талбарт оруулах", "Нууц үгээ хоёр удаа бичих", "Түгжигдсэн PDF-ээ татаж авна"],
         feats=[("Хүчтэй шифр", "AES-256 шифрлэлт"), ("Эрх хязгаарлах", "Хэвлэх, хуулах, засахыг хориглох"),
                ("Бүх програмд", "Adobe Reader, хөтөч, утсан дээр нууц үг асууна"), ("Нууцлал", "Нууц үг хаана ч хадгалагдахгүй")],
         faq=[("Нууц үгээ мартвал яах вэ?", "Сэргээх боломжгүй. Нууц үгээ найдвартай газар тэмдэглэж аваарай."),
              ("Нууц үгийг буцаад арилгаж болох уу?", "Болно — «PDF-ийн нууц үг арилгах» хэрэгслээр (нууц үгээ мэдэж байх шаардлагатай)."), PRIV, FREE],
         related=["unlock-pdf", "sign-pdf", "watermark-pdf", "compress-pdf"]),

    dict(slug="unlock-pdf", do="unpw", accept=PDF, short="Нууц үг арилгах",
         title="PDF-ийн нууц үг арилгах — үнэгүй онлайн | Graphican",
         h1="PDF-ийн нууц үг арилгах",
         desc="Нууц үгтэй PDF-ийг нэг удаа нээгээд нууц үггүй хувилбар болгон хадгална. Банкны хуулга, цахим баримтад тохиромжтой. Үнэгүй, бүртгэлгүй.",
         lead="Банкны хуулга, цахим төлбөрийн баримт зэрэг нууц үгтэй PDF-ийг нээх бүрт нууц үг асуухаас залхсан уу? Нууц үгээ нэг удаа оруулаад, нууц үггүй хувилбарыг нь хадгална.",
         steps=["Нууц үгтэй PDF-ээ оруулах", "Нууц үгээ бичиж нээх", "Нууц үггүй PDF-ээ татаж авна"],
         feats=[("Нэг товшилт", "Нээгдсэн файлын түгжээг арилгана"), ("Эх чанар", "Агуулга, чанар өөрчлөгдөхгүй"),
                ("Засах боломж", "Нээсний дараа засаж, нэгтгэж болно"), ("Нууцлал", "Нууц үг хаашаа ч илгээгдэхгүй")],
         faq=[("Нууц үг мэдэхгүй бол арилгаж болох уу?", "Үгүй. Энэ хэрэгсэл зөвхөн нууц үгээ мэддэг, өөрийн эрхтэй файлд зориулагдсан."), PRIV, FREE],
         related=["protect-pdf", "merge-pdf", "edit-pdf", "compress-pdf"]),

    dict(slug="pdf-ocr", do="ocr", accept=PDF + "," + IMG, short="Текст таних (OCR)",
         title="Скан PDF-ийг текст болгох (OCR) — монгол кирилл, үнэгүй | Graphican",
         h1="Скан PDF, зургаас текст таних (OCR)",
         desc="Скан хийсэн PDF, баримтын зургаас монгол кирилл, англи, орос бичгийг таньж хайж, хуулж болох текст болгоно. Үнэгүй, бүртгэлгүй, файл тань компьютерээс гарахгүй.",
         lead="Скан хийсэн, утсаар зураг авсан баримт дээрх бичгийг хиймэл оюунаар таниулна. PDF-д үл харагдах текстийн давхарга нэмэгдэж, Ctrl+F-ээр хайж, хуулж, Word болгож болно.",
         steps=["Скан PDF эсвэл зургаа доорх талбарт оруулах", "Хэлээ (монгол, англи, орос) сонгоод таниулах", "Хайж болох PDF-ээ татах эсвэл текстийг хуулна"],
         feats=[("Монгол кирилл", "Монгол хэлний тусгай загвар"), ("Хайж болох PDF", "Харагдах байдал өөрчлөгдөхгүй, текст нэмэгдэнэ"),
                ("Төхөөрөмж дээр", "Таних үйл явц таны хөтөч дотор"), ("Үргэлжлүүлэх", "Дараа нь Word болгох, орчуулах")],
         faq=[("Монгол үсгийг таних уу?", "Тийм. Монгол кирилл, англи, орос хэлийг таньдаг, хэд хэдэн хэлийг зэрэг сонгож болно."),
              ("Гараар бичсэн бичиг таних уу?", "Хэвлэмэл бичгийг сайн таньдаг. Гар бичмэл бага нарийвчлалтай байна."),
              ("Хэр удаан вэ?", "Анх удаа хэлний загвар ачаална, дараа нь хуудас бүр хэдэн секунд."), PRIV, FREE],
         related=["pdf-to-word", "translate-pdf", "summarize-pdf", "compress-pdf"]),

    dict(slug="edit-pdf", do="edit", accept=ANY, short="PDF засах",
         title="PDF засах — PDF дээр бичих, текст өөрчлөх, үнэгүй онлайн | Graphican",
         h1="PDF засах, PDF дээр бичих",
         desc="PDF доторх бичгийг шууд засах, шинэ текст, зураг, тодруулга, хэлбэр нэмэх, хуудас эргүүлэх, устгах. Програм суулгахгүй, үнэгүй, бүртгэлгүй.",
         lead="Үсгийн алдаа засах, огноо солих, нэр нэмэх зэрэг PDF дээрх өөрчлөлтийг Word руу хөрвүүлэлгүй шууд хийнэ. Засах бичиг дээрээ дарахад л болно.",
         steps=["PDF файлаа доорх талбарт оруулах", "«Текст засах» горимд засах бичиг дээрээ дарж өөрчлөх", "«Татах» дарж засварласан PDF-ээ авна"],
         feats=[("Бичиг засах", "Байгаа текстийг шууд өөрчилнө"), ("Нэмэх", "Текст, зураг, гарын үсэг, сум, хэлбэр, тодруулга"),
                ("Хуудас", "Эргүүлэх, устгах, дараалал солих, нэгтгэх"), ("Буцаах", "Ctrl+Z-ээр алхам бүрийг буцаана")],
         faq=[("Засахад фонт нь өөрчлөгдөх үү?", "Засварласан мөрөнд ойролцоо фонт автоматаар сонгогдоно. Фонт, хэмжээ, өнгийг баруун талын самбараас тааруулна."),
              ("PDF дээр шинээр текст бичиж болох уу?", "Болно — «Текст» (T) хэрэгслээр хүссэн газраа дарж бичнэ."),
              ("Word, Excel файл засаж болох уу?", "Болно — файл PDF болж нээгдээд засагдана."), PRIV, PHONE, FREE],
         related=["sign-pdf", "fill-pdf", "pdf-to-word", "watermark-pdf"]),

    dict(slug="fill-pdf", do="fill", accept=PDF, short="Маягт бөглөх",
         title="PDF маягт бөглөх, бөглөх талбар нэмэх — үнэгүй онлайн | Graphican",
         h1="PDF маягт бөглөх",
         desc="Анкет, өргөдөл зэрэг PDF маягтыг хэвлэхгүйгээр бөглөнө. Бусдаар бөглүүлэх текст, чагт, огнооны талбар нэмнэ. Үнэгүй, бүртгэлгүй.",
         lead="Хэвлэж, бөглөөд, скан хийх шаардлагагүй. Хоосон зайн дээр текст бичиж, ✓ тэмдэг тавьж, гарын үсгээ зураад шууд илгээнэ. Мөн бусдад бөглүүлэх жинхэнэ PDF маягт үүсгэнэ.",
         steps=["PDF маягтаа доорх талбарт оруулах", "Хоосон зай бүр дээр дарж бичих, ✓ тавих", "Бөглөсөн PDF-ээ татаж илгээнэ"],
         feats=[("Текст, ✓ ✗", "Хүссэн газраа бичиж, тэмдэглэнэ"), ("Бөглөх талбар", "Текст, чагт, огноо, гарын үсгийн талбар"),
                ("Гарын үсэг", "Зурах, бичих, зургаар"), ("Нууцлал", "Хувийн мэдээлэл компьютерээс гарахгүй")],
         faq=[("Бусдад бөглүүлэх маягт хийж болох уу?", "Болно — «Талбар нэмэх»-ээр үүсгэсэн талбарууд Adobe Reader, хөтөч дээр бөглөгддөг."), PRIV, FREE],
         related=["sign-pdf", "edit-pdf", "protect-pdf", "jpg-to-pdf"]),

    dict(slug="pdf-page-numbers", do="pnum", accept=PDF, short="Хуудасны дугаар",
         title="PDF-д хуудасны дугаар нэмэх — үнэгүй онлайн | Graphican",
         h1="PDF-д хуудасны дугаар нэмэх",
         desc="Дипломын ажил, тайлан, номын PDF-д хуудасны дугаар автоматаар нэмнэ. Байрлал, хэлбэр, эхлэх дугаараа сонгоно. Үнэгүй, бүртгэлгүй.",
         lead="Дипломын ажил, тайлан, гарын авлагадаа хуудасны дугаарыг нэг дор нэмнэ. Байрлал, хэмжээ болон «1», «1 / 12», «Хуудас 1», «— 1 —» зэрэг хэлбэрээс сонгоно.",
         steps=["PDF файлаа доорх талбарт оруулах", "Байрлал, хэлбэр, эхлэх дугаараа сонгох", "Дугаарласан PDF-ээ татаж авна"],
         feats=[("5 байрлал", "Доор эсвэл дээр, голд, зүүн, баруун"), ("5 хэлбэр", "1 · 1 / 12 · Хуудас 1 · — 1 —"),
                ("Нүүр алгасах", "Эхний хуудсыг дугаарлахгүй байж болно"), ("Нууцлал", "Файл компьютерээс гарахгүй")],
         faq=[("Нүүр хуудсыг дугаарлахгүй байж болох уу?", "Болно — «Эхний хуудсыг алгасах»-ыг чагтлаад, эхлэх дугаараа тохируулна."), PRIV, FREE],
         related=["merge-pdf", "watermark-pdf", "edit-pdf", "split-pdf"]),

    dict(slug="watermark-pdf", do="wm", accept=PDF, short="Усан тэмдэг",
         title="PDF-д усан тэмдэг (watermark) нэмэх — үнэгүй онлайн | Graphican",
         h1="PDF-д усан тэмдэг нэмэх",
         desc="PDF-ийн бүх хуудсанд «НООРОГ», «ДОТООД», компанийн нэр зэрэг усан тэмдэг нэмнэ. Өнгө, тунгалаг, өнцгөө тохируулна. Үнэгүй, бүртгэлгүй.",
         lead="Баримтаа хуулбарлуулахаас сэргийлж, эсвэл ноорог гэдгийг тодорхой харуулахын тулд бүх хуудсанд усан тэмдэг нэмнэ.",
         steps=["PDF файлаа доорх талбарт оруулах", "Усан тэмдгийн бичиг, өнгө, тунгалгаа тохируулах", "Бүх хуудсанд нэмээд татаж авна"],
         feats=[("Текст", "Дурын бичиг, монгол кирилл"), ("Тохиргоо", "Өнгө, тунгалаг, хэмжээ, өнцөг"),
                ("Бүх хуудас", "Нэг товшилтоор бүх хуудсанд"), ("Хамгаалах", "Нууц үгтэй хослуулж болно")],
         faq=[("Усан тэмдгийг дараа нь арилгаж болох уу?", "Татахаасаа өмнө Ctrl+Z-ээр буцаана. Татсан PDF дээрх тэмдгийг засварлагч дээр сонгож устгаж болно."), PRIV, FREE],
         related=["protect-pdf", "pdf-page-numbers", "sign-pdf", "edit-pdf"]),

    dict(slug="summarize-pdf", do="sum", accept=PDF, short="PDF хураангуйлах",
         title="PDF хураангуйлах, PDF-ээс асуух — AI, үнэгүй онлайн | Graphican",
         h1="PDF-ийг AI-аар хураангуйлах",
         desc="Урт PDF-ийн гол санааг хиймэл оюунаар монголоор товчилно, баримтаас асуулт асууж хариулт авна. Үнэгүй, бүртгэлгүй.",
         lead="Олон хуудастай тайлан, гэрээ, судалгааг бүгдийг унших цаг байхгүй юу? AI гол санааг нь хэдхэн мөрөөр гаргаж, «Төлбөрийн нөхцөл юу вэ?» гэх мэт асуултад баримт дээр тулгуурлан хариулна.",
         steps=["PDF файлаа доорх талбарт оруулах", "«Хураангуйлах» эсвэл «Асуух»-ыг сонгох", "Хариултаа хуулж аваад ашиглана"],
         feats=[("Монголоор", "Хураангуйг монгол хэлээр гаргана"), ("Асуулт хариулт", "Баримтаас л хариулна"),
                ("Олон хэл", "Англи, орос PDF-ийг ч монголоор товчилно"), ("Скан PDF", "OCR-оор бичгийг таниулаад ашиглана")],
         faq=[("Файл минь хаашаа илгээгдэх вэ?", "Зөвхөн PDF-ийн текст AI руу явж, хариу гарсны дараа хадгалагдахгүй. PDF файл өөрөө компьютерээс гарахгүй."),
              ("Хэр урт PDF хураангуйлах вэ?", "Хэдэн арван хуудас сайн ажиллана. Маш урт баримтын эхний хэсгийг илүү анхаарч болно."), FREE],
         related=["translate-pdf", "pdf-ocr", "pdf-to-word", "edit-pdf"]),
]

# the older, JS-rendered tool pages that belong in the “all tools” grid too
TOOL_LINKS = [("/tools/mongol-font/", "Монгол фонт хайгч"), ("/tools/brand-color/", "Брэндийн өнгө үүсгэгч"), ("/tools/templates/", "Монгол сошиал загвар"),
              ("/tools/pdfedit/", "PDF засварлагч"), ("/tools/upscale/", "Зураг томруулах (AI)"),
              ("/tools/bgremove/", "Зургийн дэвсгэр арилгах"), ("/tools/socialcrop/", "Сошиал хэмжээ рүү тайрах"),
              ("/tools/pdf/", "PDF ⇄ зураг хөрвүүлэгч"), ("/editor/", "Онлайн дизайн засварлагч")]


def e(s):
    return html.escape(str(s or ""), quote=True)


def strip(s):
    return re.sub(r"<[^>]+>", "", s)


def header_html():
    t = open(os.path.join(ROOT, "tools", "upscale", "index.html"), encoding="utf-8").read()
    h = re.search(r'<header class="header".*?</header>', t, re.S).group(0)
    h = h.replace('class="dm-item on"', 'class="dm-item"').replace(' aria-current="page"', "")
    return h.replace('<details class="dmenu active">', '<details class="dmenu">')


def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + "</script>"


def page(p, header):
    path = f"/tools/{p['slug']}/"
    url = SITE + path
    img = SITE + "/assets/uploads/og-cover.jpg"
    graph = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": url + "#page", "url": url, "name": p["title"], "description": p["desc"], "inLanguage": "mn",
         "isPartOf": {"@id": SITE + "/#website"}, "primaryImageOfPage": img,
         "breadcrumb": {"@type": "BreadcrumbList", "itemListElement": [
             {"@type": "ListItem", "position": 1, "name": "Graphican", "item": SITE + "/"},
             {"@type": "ListItem", "position": 2, "name": "Design tools", "item": SITE + "/tools/"},
             {"@type": "ListItem", "position": 3, "name": p["h1"], "item": url}]}},
        {"@type": "WebApplication", "name": p["h1"], "description": p["desc"], "url": url, "inLanguage": "mn",
         "applicationCategory": "UtilitiesApplication", "operatingSystem": "Windows, macOS, Android, iOS",
         "browserRequirements": "Requires JavaScript", "isAccessibleForFree": True,
         "offers": {"@type": "Offer", "price": "0", "priceCurrency": "MNT"},
         "provider": {"@id": SITE + "/#org"}},
        {"@type": "HowTo", "name": p["h1"], "step": [{"@type": "HowToStep", "position": i + 1, "text": s} for i, s in enumerate(p["steps"])]},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in p["faq"]]},
    ]}
    by = {x["slug"]: x for x in PAGES}
    rel = [by[s] for s in p.get("related", []) if s in by]
    others = [x for x in PAGES if x["slug"] != p["slug"]]
    multi = p.get("multi")

    steps = "".join(f'<li><span class="lp-n">{i + 1}</span><p>{e(s)}</p></li>' for i, s in enumerate(p["steps"]))
    feats = "".join(f'<li><b>{e(b)}</b><span>{e(t)}</span></li>' for b, t in p["feats"])
    faq = "".join(f'<details class="lp-q"><summary>{e(q)}</summary><p>{a}</p></details>' for q, a in p["faq"])
    relh = "".join(f'<a class="lp-card" href="/tools/{x["slug"]}/"><b>{e(x["h1"])}</b><span>{e(x["desc"].split(".")[0])}.</span></a>' for x in rel)
    allh = "".join(f'<a href="/tools/{x["slug"]}/">{e(x["short"])}</a>' for x in others) + \
        "".join(f'<a href="{u}">{e(n)}</a>' for u, n in TOOL_LINKS)

    return f"""<!DOCTYPE html>
<html lang="mn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(p['title'])}</title>
<meta name="description" content="{e(p['desc'])}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Graphican">
<meta property="og:locale" content="mn_MN">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{e(p['title'])}">
<meta property="og:description" content="{e(p['desc'])}">
<meta property="og:image" content="{img}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(p['title'])}">
<meta name="twitter:description" content="{e(p['desc'])}">
<meta name="twitter:image" content="{img}">
{ld(graph)}
<script>if(location.hostname==='www.graphican.online')location.replace('https://graphican.online'+location.pathname+location.search+location.hash)</script>
<meta name="theme-color" content="#0a0a10">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2308080a'/%3E%3Ccircle cx='16' cy='16' r='7' fill='%23a497ff'/%3E%3C/svg%3E">
<link rel="preload" href="/assets/fonts/web/InterTight-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/web/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts/web/fonts.css">
<link rel="stylesheet" href="/assets/style.css?v=35">
<link rel="stylesheet" href="/assets/design.css?v=34">
<link rel="stylesheet" href="/assets/landing.css?v={V}">
</head>
<body class="design-page lp-page">

{header}

<main class="lp">
  <nav class="lp-crumbs" aria-label="Breadcrumb"><a href="/">Graphican</a><span>/</span><a href="/tools/">Design tools</a><span>/</span><span aria-current="page">{e(p['h1'])}</span></nav>

  <section class="lp-hero">
    <p class="lp-kicker">ҮНЭГҮЙ · БҮРТГЭЛГҮЙ · ОНЛАЙН</p>
    <h1>{e(p['h1'])}</h1>
    <p class="lp-lead">{e(p['lead'])}</p>
    <label class="lp-drop" id="lp-drop" data-do="{e(p['do'])}">
      <input type="file" id="lp-file" accept="{e(p['accept'])}"{' multiple' if multi else ''} hidden>
      <span class="lp-drop-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7 9m5-5 5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>
      <span class="lp-btn">{'Файлуудаа сонгох' if multi else 'Файлаа сонгох'}</span>
      <span class="lp-drop-s">эсвэл энд чирж оруулна уу</span>
    </label>
    <ul class="lp-trust"><li>Бүрэн үнэгүй</li><li>Бүртгэл шаардахгүй</li><li>Усан тэмдэггүй</li><li>Утсан дээр ажиллана</li></ul>
  </section>

  <section class="lp-sec">
    <h2>{e(p['h1'])} — 3 алхам</h2>
    <ol class="lp-steps">{steps}</ol>
  </section>

  <section class="lp-sec">
    <h2>Боломжууд</h2>
    <ul class="lp-feats">{feats}</ul>
  </section>

  <section class="lp-sec">
    <h2>Түгээмэл асуултууд</h2>
    <div class="lp-faq">{faq}</div>
  </section>

  <section class="lp-sec">
    <h2>Холбоотой хэрэгслүүд</h2>
    <div class="lp-cards">{relh}</div>
  </section>

  <section class="lp-sec lp-all">
    <h2>Бүх үнэгүй хэрэгслүүд</h2>
    <div class="lp-links">{allh}</div>
  </section>
</main>

<footer class="lp-foot">
  <p><a href="/">Graphican</a> — брэндинг, digital design, видео. Эдгээр хэрэгслийг дизайнер Анхбаяр бүтээж, хүн бүрт үнэгүй нээлттэй болгосон.</p>
  <p><a href="/about/#work">Ажлууд</a> · <a href="/design/">Design guide</a> · <a href="/tools/">Design tools</a> · <a href="/about/#contact">Хамтран ажиллах</a></p>
</footer>

<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="/assets/handoff.js?v=29"></script>
<script src="/assets/landing.js?v={V}"></script>
</body>
</html>
"""


def build():
    header = header_html()
    for p in PAGES:
        d = os.path.join(ROOT, "tools", p["slug"])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(page(p, header))
    return [f"/tools/{p['slug']}/" for p in PAGES]


if __name__ == "__main__":
    print("landings:", len(build()))
