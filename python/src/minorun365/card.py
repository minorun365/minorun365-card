import json
from pathlib import Path
from time import sleep

import typer
from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.style import Style
from rich.text import Text

app = typer.Typer()


def _data_path() -> Path:
    bundled = Path(__file__).parent / "data.json"
    if bundled.exists():
        return bundled
    return Path(__file__).resolve().parents[3] / "data.json"


def _load_data() -> dict:
    return json.loads(_data_path().read_text(encoding="utf-8"))


def create_content():
    data = _load_data()

    all_labels = [item["label"] for item in data["info"]]
    for section in data["sections"]:
        all_labels += [link["label"] for link in section["links"]]
    label_width = max(len(f"{lbl}:") for lbl in all_labels) + 2

    def padded(label: str) -> str:
        return f"{label}:".ljust(label_width)

    content = Text()
    content.append(f"\n{data['name']}\n\n", style="bold cyan")

    for idx, item in enumerate(data["info"]):
        content.append(padded(item["label"]), style="green")
        suffix = "\n\n" if idx == len(data["info"]) - 1 else "\n"
        content.append(item["value"] + suffix, style="yellow")

    for s_idx, section in enumerate(data["sections"]):
        content.append(f"[{section['title']}]\n", style="bold cyan")
        for l_idx, link in enumerate(section["links"]):
            content.append(padded(link["label"]), style="green")
            is_last_link = l_idx == len(section["links"]) - 1
            is_last_section = s_idx == len(data["sections"]) - 1
            sep = "\n\n" if is_last_link and not is_last_section else "\n"
            content.append(link["url"] + sep, style="blue underline")

    return content


@app.command()
def main():
    full_content = create_content()
    lines = full_content.split("\n")

    console = Console()

    with Live(console=console, refresh_per_second=20) as live:
        content = Text()
        for line in lines:
            for char in line:
                content.append(char)
                panel = Panel(
                    content,
                    expand=False,
                    padding=(0, 2),
                )
                live.update(panel)
                sleep(0.02)
            content.append("\n")
            live.update(panel)
            sleep(0.1)

        for i in range(1, 50):
            panel.border_style = Style(color=f"color({i*5})")
            live.update(panel)
            sleep(0.1)


if __name__ == "__main__":
    app()
