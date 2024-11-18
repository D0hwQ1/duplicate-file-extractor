const fs = require("fs");
const iconv = require("iconv-lite");

(async () => {
  const buffer = await fs.readFileSync(`${__dirname}/duplicate_file.csv`);
  const files = iconv.decode(buffer, "utf-16");

  const removeFileNames = [];

  let lines = files
    .split("\n")
    .slice(1)
    .map((line) => line.split("\t"))
    .filter((line) => line.length === 5 && !line[2].includes("pjt137/proj"));

  lines = lines.filter((line) => {
    const fileName = line[2];

    if (fileName.includes("#recycle")) removeFileNames.push(fileName);

    return !removeFileNames.includes(fileName);
  });

  const lastIdx = lines[lines.length - 1][0];
  const result = [];

  for (let i = 1; i < lastIdx; i++) {
    const files = lines
      .filter((line) => line[0] === i.toString())
      .sort((a, b) => {
        // pjt137 출현 횟수 계산
        const countA = (a[2].match(/pjt137/g) || []).length;
        const countB = (b[2].match(/pjt137/g) || []).length;

        // pjt137이 2번 이상 포함된 파일을 최후순위로 정렬
        if (countA >= 2 && countB < 2) return 1;
        if (countA < 2 && countB >= 2) return -1;

        // 날짜 문자열에서 따옴표 제거 후 Date 객체로 변환
        const dateA = new Date(a[4].replace(/"/g, "").replace(/(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})/, "$1-$2-$3T$4:$5:$6"));
        const dateB = new Date(b[4].replace(/"/g, "").replace(/(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})/, "$1-$2-$3T$4:$5:$6"));

        // 날짜가 같은 경우 경로 우선순위 비교
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        } else {
          if (a[2].includes("history") && !b[2].includes("history")) return -1;
          if (!a[2].includes("history") && b[2].includes("history")) return 1;

          const isPhotosA = a[2].includes("Photos");
          const isPhotosB = b[2].includes("Photos");
          const isPicPubA = a[2].includes("pic_pub");
          const isPicPubB = b[2].includes("pic_pub");

          if (isPicPubA && isPhotosB) return -1;
          if (isPhotosA && isPicPubB) return 1;
        }
      });

    files.forEach((file, idx) => {
      if (idx === 0) return;
      else removeFileNames.push(file[2]);
    });

    result.push(files);
  }

  console.log(result.slice(0, 10));

  fs.writeFileSync(`${__dirname}/remove_file_names.txt`, `${removeFileNames.join(" ")}`);
  fs.writeFileSync(`${__dirname}/remove_file_names_new.txt`, `${removeFileNames.join("\n")}`);
})();
