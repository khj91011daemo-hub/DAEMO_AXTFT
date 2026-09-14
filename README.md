# 코드 미리보기 (Teams Tab)

Claude로 작성한 HTML/Markdown 코드를 붙여넣으면 즉시 미리보기를 확인하고,
그 결과를 팀즈 채널·채팅에 링크 하나로 공유할 수 있는 Microsoft Teams 탭 앱입니다.

- 순수 정적 페이지(HTML/CSS/JS)라서 **서버나 DB가 필요 없습니다.**
- 공유 링크는 코드를 URL 뒤(`#s=...`)에 압축·인코딩해서 담는 방식이라,
  GitHub Pages만으로 "붙여넣기 → 미리보기 → 링크 복사 → 팀즈에 공유"가 끝납니다.
- 큰 파일(수백 KB 이상의 코드)을 공유하면 링크가 매우 길어질 수 있으니,
  일반적인 코드 스니펫/컴포넌트 공유 용도에 적합합니다.

## 1. GitHub Pages로 배포하기

1. 이 폴더 전체를 GitHub 저장소에 올립니다 (아래 "GitHub에 올리기" 참고).
2. 저장소 **Settings → Pages** 에서 Source를 `Deploy from a branch`,
   Branch를 `main` / `/(root)` 로 설정합니다.
3. 몇 분 뒤 `https://<GitHub사용자명>.github.io/<저장소명>/` 주소로 접속되는지 확인합니다.

## 2. Teams 앱 패키지 만들기

`manifest/manifest.json` 안의 `GITHUB_USERNAME`, `REPO_NAME` 부분을
실제 GitHub 사용자명/저장소명으로 바꾼 뒤, 아이콘과 함께 zip으로 묶어야 합니다.
아래 스크립트가 자동으로 해줍니다.

```bash
python scripts/package_manifest.py <GitHub사용자명> <저장소명>
```

실행하면 `teams-app-package.zip` 파일이 생성됩니다. 이 zip 파일이 Teams에 업로드할 앱 패키지입니다.

## 3. Teams에 앱 업로드 (사이드로딩)

조직에서 사용자 지정 앱 업로드가 허용되어 있어야 합니다 (Teams 관리자센터에서 설정).

1. Teams 왼쪽 메뉴 **앱** → 하단 **앱 업로드** → **사용자 지정 앱 업로드**
2. 위에서 만든 `teams-app-package.zip` 선택
3. 개인 탭으로 추가하거나, 원하는 채널에서 `+` → 방금 만든 앱 → 탭으로 추가

전체 팀/조직이 함께 쓰려면 Teams 관리자센터(admin.teams.microsoft.com) →
**Teams 앱 → 앱 관리 → 업로드** 에서 같은 zip을 조직 카탈로그에 올리면,
모든 팀원이 검색해서 추가할 수 있습니다.

## 4. 사용 방법

1. 왼쪽에 HTML 또는 Markdown 코드를 붙여넣습니다.
2. 오른쪽에서 바로 렌더링 결과를 확인합니다 (상단에서 HTML/Markdown 모드 전환).
3. **공유 링크 복사** 버튼을 누르면, 지금 작성한 코드가 그대로 담긴 링크가 클립보드에 복사됩니다.
4. 이 링크를 팀즈 채널/채팅에 붙여넣으면, 클릭한 사람 누구나 같은 미리보기를 바로 볼 수 있습니다.

## 로컬에서 미리 확인하기

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000` 접속 (Teams 밖에서도 동일하게 동작합니다).

## 파일 구성

- `index.html`, `app.js`, `styles.css` — 탭 본체 (코드 입력 + 미리보기 + 공유 링크)
- `config.html` — 채널/그룹 채팅에 탭으로 추가할 때 나오는 설정 화면
- `manifest/manifest.json` — Teams 앱 매니페스트 (사용자명/저장소명 채워 넣어야 함)
- `manifest/color.png`, `manifest/outline.png` — 앱 아이콘
- `scripts/package_manifest.py` — 매니페스트 채워서 업로드용 zip 생성
