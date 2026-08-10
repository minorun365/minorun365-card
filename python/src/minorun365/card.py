import json
from pathlib import Path
from time import sleep

import typer
from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.text import Text

app = typer.Typer()


def _data_path() -> Path:
    return Path(__file__).parent / "data.json"


def _load_data() -> dict:
    return json.loads(_data_path().read_text(encoding="utf-8"))


def _palette() -> dict:
    return {
        "title": "bold #007f91",
        "section": "bold #3478a8",
        "label": "#767676",
        "value": "default",
        "link": "underline",
        "border": "#767676",
    }


def create_content(palette=None):
    data = _load_data()
    palette = palette or _palette()

    all_labels = [item["label"] for item in data["info"]]
    for section in data["sections"]:
        all_labels += [link["label"] for link in section["links"]]
    label_width = max(len(f"{lbl}:") for lbl in all_labels) + 2

    def padded(label: str) -> str:
        return f"{label}:".ljust(label_width)

    content = Text()
    content.append(f"\n{data['name']}\n\n", style=palette["title"])

    for idx, item in enumerate(data["info"]):
        content.append(padded(item["label"]), style=palette["label"])
        suffix = "\n\n" if idx == len(data["info"]) - 1 else "\n"
        content.append(item["value"] + suffix, style=palette["value"])

    for s_idx, section in enumerate(data["sections"]):
        content.append(f"[{section['title']}]\n", style=palette["section"])
        for l_idx, link in enumerate(section["links"]):
            content.append(padded(link["label"]), style=palette["label"])
            is_last_link = l_idx == len(section["links"]) - 1
            is_last_section = s_idx == len(data["sections"]) - 1
            sep = "\n\n" if is_last_link and not is_last_section else "\n"
            content.append(link["url"] + sep, style=palette["link"])

    return content


@app.command()
def main():
    palette = _palette()
    full_content = create_content(palette)
    lines = full_content.split("\n")

    console = Console()

    with Live(console=console, refresh_per_second=20) as live:
        content = Text()
        panel = Panel(
            content,
            border_style=palette["border"],
            expand=False,
            padding=(0, 2),
        )
        for line in lines:
            for char in line:
                content.append(char)
                panel = Panel(
                    content,
                    border_style=palette["border"],
                    expand=False,
                    padding=(0, 2),
                )
                live.update(panel)
                sleep(0.02)
            content.append("\n")
            live.update(panel)
            sleep(0.1)


if __name__ == "__main__":
    app()
