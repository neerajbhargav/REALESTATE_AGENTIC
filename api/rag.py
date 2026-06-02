import os

class FileVectorDB:
    def __init__(self):
        self.text = "No zoning data loaded."
        try:
            with open(os.path.join(os.path.dirname(__file__), "zoning.txt"), "r") as f:
                self.text = f.read()
        except:
            pass

    def query(self, search_term: str) -> str:
        """Search the zoning code text using simple keyword matching."""
        search_term = search_term.upper()
        
        # Simple extraction: return the paragraph containing the search term
        paragraphs = self.text.split("\n\n")
        for p in paragraphs:
            if search_term in p.upper() or search_term.replace(' ', '') in p.upper():
                return p.strip()
                
        # Fallback to returning the whole text if it's small enough, or just a summary
        return self.text

rag_db = FileVectorDB()

def get_zoning_rule(district: str) -> str:
    return rag_db.query(district)
